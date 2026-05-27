import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { verifyPayment } from '@/app/lib/verify-payment';

const validateTokenSymbol = (symbol: string): boolean => /^[A-Z0-9]{2,10}$/.test(symbol);
const validateTokenName = (name: string): boolean => name.length >= 2 && name.length <= 32;
const BLACKLIST = ["SOL", "USDC", "USDT", "BONK", "WIF", "JUP", "PYTH", "JTO"];

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
      // Verify payment only (NO token creation here)
      const verifyResult = await verifyPayment(signature, userPublicKey);
      if (!verifyResult.verified) {
        return NextResponse.json({ error: verifyResult.error || 'Payment verification failed' }, { status: 400 });
      }

      // Return success - frontend will create the token
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Payment verified, ready to launch',
      });

    } finally {
      await redis.del(lockKey);
    }

  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}