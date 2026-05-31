import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { verifyPayment } from '@/app/lib/verify-payment';

const REFERRAL_REWARD = 0.05;

// Milestone bonusları — her milestone bir kez ödenir
const MILESTONES: { count: number; bonus: number; vip?: boolean }[] = [
  { count: 5,    bonus: 0.05  },
  { count: 10,   bonus: 0.1   },
  { count: 25,   bonus: 0.25  },
  { count: 50,   bonus: 0.5   },
  { count: 100,  bonus: 1.0   },
  { count: 250,  bonus: 2.5   },
  { count: 500,  bonus: 5.0   },
  { count: 1000, bonus: 10.0, vip: true },
];

const validateTokenSymbol = (symbol: string): boolean =>
  /^[A-Z0-9]{2,10}$/.test(symbol);

const validateTokenName = (name: string): boolean =>
  name.length >= 2 && name.length <= 32;

const BLACKLIST = ['SOL','USDC','USDT','BONK','WIF','JUP','PYTH','JTO'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signature, userPublicKey, tokenData, promoCode } = body;

    if (!signature || !userPublicKey || !tokenData) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!validateTokenName(tokenData.name)) {
      return NextResponse.json({ error: 'Invalid token name' }, { status: 400 });
    }

    if (!validateTokenSymbol(tokenData.symbol)) {
      return NextResponse.json({ error: 'Invalid token symbol' }, { status: 400 });
    }

    if (BLACKLIST.includes(tokenData.symbol)) {
      return NextResponse.json({ error: 'Reserved ticker' }, { status: 400 });
    }

    if (tokenData.description && tokenData.description.length > 500) {
      return NextResponse.json({ error: 'Description too long' }, { status: 400 });
    }

    // Rate limit
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateKey = `rate:create:${ip}:${userPublicKey}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) await redis.expire(rateKey, 60);
    if (rateCount > 3) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Daily wallet limit
    const walletRateKey = `rate:wallet:${userPublicKey}`;
    const walletRateCount = await redis.incr(walletRateKey);
    if (walletRateCount === 1) await redis.expire(walletRateKey, 86400);
    if (walletRateCount > 10) {
      return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 });
    }

    // Create lock
    const lockKey = `lock:create:${userPublicKey}`;
    const locked = await redis.setnx(lockKey, 'locked');
    if (!locked) {
      return NextResponse.json({ error: 'Previous request still processing' }, { status: 429 });
    }
    await redis.expire(lockKey, 30);

    try {
      // Verify payment
      const verifyResult = await verifyPayment(signature, userPublicKey);
      if (!verifyResult.verified) {
        return NextResponse.json(
          { error: verifyResult.error || 'Payment verification failed' },
          { status: 400 }
        );
      }

      // =========================
      // REFERRAL SYSTEM
      // =========================

      let referralApplied = false;
      let inviterWallet: string | null = null;
      let milestoneReached: { count: number; bonus: number; vip?: boolean } | null = null;

      if (promoCode && typeof promoCode === 'string') {
        const normalizedCode = promoCode.trim().toUpperCase();

        inviterWallet = await redis.get(`ref:code:${normalizedCode}`) as string | null;

        if (inviterWallet && inviterWallet !== userPublicKey) {

          // Per-referral reward
          await redis.incrbyfloat(`ref:earnings:${inviterWallet}:pending`, REFERRAL_REWARD);

          // Count + leaderboard
          const newCount = await redis.incr(`ref:count:${inviterWallet}`);
          await redis.zadd('ref:leaderboard', { score: newCount, member: inviterWallet });

          // History
          await redis.sadd(`ref:list:${inviterWallet}`, userPublicKey);
          await redis.sadd(`ref:used-by:${userPublicKey}`, normalizedCode);

          // =========================
          // MILESTONE CHECK
          // =========================

          const milestone = MILESTONES.find((m) => m.count === newCount);

          if (milestone) {
            // SETNX = idempotent, aynı milestone iki kez ödenmiyor
            const milestoneKey = `ref:milestone:${inviterWallet}:${milestone.count}`;
            const firstTime = await redis.setnx(milestoneKey, '1');

            if (firstTime) {
              // Bonus ekle
              await redis.incrbyfloat(
                `ref:earnings:${inviterWallet}:pending`,
                milestone.bonus
              );

              // 1000 referral VIP
              if (milestone.vip) {
                await redis.set(`ref:vip:${inviterWallet}`, '1');
                await redis.sadd('ref:vip-queue', inviterWallet); // admin paneli için
              }

              milestoneReached = milestone;
            }
          }

          referralApplied = true;
        }
      }

      // User tracking
      await redis.sadd('users', userPublicKey);

      return NextResponse.json({
        success: true,
        verified: true,
        referralApplied,
        inviterWallet: referralApplied ? inviterWallet : null,
        rewardAmount: referralApplied ? REFERRAL_REWARD : 0,
        milestoneReached: milestoneReached
          ? { count: milestoneReached.count, bonus: milestoneReached.bonus, vip: milestoneReached.vip ?? false }
          : null,
        message: 'Payment verified, ready to launch',
      });

    } finally {
      await redis.del(lockKey);
    }

  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}