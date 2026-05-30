import { NextRequest, NextResponse } from 'next/server';
import { redis, KEYS } from '@/app/lib/redis';

const REFERRAL_REWARD = 0.05; // SOL
const FIRST_TOKEN_ONLY = true;

export async function POST(req: NextRequest) {
  try {
    const { mintAddress, name, symbol, imageUrl, userPublicKey, signature } = await req.json();

    if (!mintAddress || !userPublicKey || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ===============================
    // RATE LIMIT
    // ===============================
    const rateKey = `rate-limit:${userPublicKey}`;
    const rate = await redis.incr(rateKey);

    if (rate === 1) await redis.expire(rateKey, 300);
    if (rate > 3) {
      return NextResponse.json({ error: 'Rate limit exceeded. Wait 5 minutes.' }, { status: 429 });
    }

    // ===============================
    // DUPLICATE PROTECTION
    // ===============================
    const existing = await redis.get(`bonding-curve:creator:${mintAddress}`);
    if (existing) {
      return NextResponse.json({ error: 'Token already exists' }, { status: 400 });
    }

    // ===============================
    // FIRST TOKEN CHECK (ANTI FARM)
    // ===============================
    const userTokenCountKey = `user:token-count:${userPublicKey}`;
    const tokenCount = await redis.incr(userTokenCountKey);
    if (tokenCount === 1) await redis.expire(userTokenCountKey, 86400 * 30);

    // ===============================
    // SAVE TOKEN
    // ===============================
    await redis.set(`bonding-curve:creator:${mintAddress}`, userPublicKey);
    await redis.sadd('bonding-curve:tokens', mintAddress);

    await redis.set(
      `token:metadata:${mintAddress}`,
      JSON.stringify({
        name,
        symbol,
        imageUrl,
        creator: userPublicKey,
        createdAt: Date.now(),
        signature,
      })
    );

    // ===============================
    // TRENDING
    // ===============================
    await redis.zincrby('trending:tokens', 1, mintAddress);
    await redis.expire('trending:tokens', 86400);

    // ===============================
    // REFERRAL ENGINE (CORE ADDITION)
    // ===============================

    const referralKey = `referral:by:${userPublicKey}`;
    const referrer = await redis.get(referralKey);

    if (referrer && tokenCount === 1) {
      // only first token reward

      const earningsKey = `${KEYS.earnings}:${referrer}`;

      const earningsRaw = await redis.get(earningsKey);

      const earnings = earningsRaw
        ? JSON.parse(earningsRaw as string)
        : { pending: 0, claimed: 0, referrals: [] };

      // prevent duplicate referral reward per user
      if (!earnings.referrals.includes(userPublicKey)) {
        earnings.pending += REFERRAL_REWARD;
        earnings.referrals.push(userPublicKey);

        await redis.set(earningsKey, JSON.stringify(earnings));

        // optional leaderboard boost
        await redis.zincrby(KEYS.boostLeaderboard, 1, referrer);
      }
    }

    console.log('✅ Token tracked + referral processed:', mintAddress);

    return NextResponse.json({ success: true, mintAddress });

  } catch (error: any) {
    console.error('Track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}