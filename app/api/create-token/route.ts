import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUmi } from '@/app/lib/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import { redis } from '@/app/lib/redis';
import { verifyPayment } from '@/app/lib/verify-payment';

const validateTokenSymbol = (symbol: string): boolean => /^[A-Z0-9]{2,10}$/.test(symbol);
const validateTokenName = (name: string): boolean => name.length >= 2 && name.length <= 32;
const BLACKLIST = ["SOL", "USDC", "USDT", "BONK", "WIF", "JUP", "PYTH", "JTO"];
const TIMEOUT_MS = 30000;

interface LaunchResult {
  mintAddress: string;
  launch?: {
    link?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { signature, userPublicKey, tokenData } = await req.json();

    if (!signature || !userPublicKey || !tokenData) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Validation
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

    // Rate limits
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateKey = `rate:create:${ip}:${userPublicKey}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) await redis.expire(rateKey, 60);
    if (rateCount > 3) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Wallet daily limit
    const walletRateKey = `rate:wallet:${userPublicKey}`;
    const walletRateCount = await redis.incr(walletRateKey);
    if (walletRateCount === 1) await redis.expire(walletRateKey, 86400);
    if (walletRateCount > 10) {
      return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 });
    }

    // Redis lock
    const lockKey = `lock:create:${userPublicKey}`;
    const locked = await redis.setnx(lockKey, 'locked');
    if (!locked) {
      return NextResponse.json({ error: 'Previous request still processing' }, { status: 429 });
    }
    await redis.expire(lockKey, 30);

    try {
      // ✅ 2 ARGÜMAN (expectedAmount kalktı)
      const verifyResult = await verifyPayment(signature, userPublicKey);
      if (!verifyResult.verified) {
        return NextResponse.json({ error: verifyResult.error || 'Payment verification failed' }, { status: 400 });
      }

      // Server-side launch with timeout
      const umi = getPlatformUmi();
      
      const result = await Promise.race([
        createAndRegisterLaunch(umi, {}, {
          wallet: userPublicKey,
          launchType: 'bondingCurve',
          token: {
            name: tokenData.name,
            symbol: tokenData.symbol,
            image: tokenData.imageUrl,
            description: tokenData.description || '',
          },
          launch: { creatorFeeWallet: process.env.BONDING_CURVE_FEE_WALLET },
        } as any) as Promise<LaunchResult>,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Launch timeout')), TIMEOUT_MS))
      ]);

      if (!result?.mintAddress) {
        throw new Error('Invalid launch response');
      }

      // Track launch
      await redis.set(`bonding-curve:creator:${result.mintAddress}`, userPublicKey);
      await redis.sadd('bonding-curve:tokens', result.mintAddress);

      return NextResponse.json({
        success: true,
        mintAddress: result.mintAddress,
        launchLink: result.launch?.link || null,
      });

    } finally {
      await redis.del(lockKey);
    }

  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}