import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUmi } from '@/app/lib/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import { redis } from '@/app/lib/redis';
import { verifyPayment } from '@/app/lib/verify-payment';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'your-internal-secret-change-me';

const validateTokenSymbol = (symbol: string): boolean => {
  return /^[A-Z0-9]{2,10}$/.test(symbol);
};

const validateTokenName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 32;
};

const BLACKLIST = ["SOL", "USDC", "USDT", "BONK", "WIF", "JUP", "PYTH", "JTO"];

export async function POST(req: NextRequest) {
  try {
    // Internal security check
    const internalKey = req.headers.get('x-internal-secret');
    if (internalKey !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signature, userPublicKey, tokenData } = await req.json();

    if (!signature || !userPublicKey || !tokenData) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Backend validation
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

    // Rate limit check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateKey = `rate:create:${ip}:${userPublicKey}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) await redis.expire(rateKey, 60);
    if (rateCount > 3) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    // Verify payment
    const verifyResult = await verifyPayment(signature, userPublicKey, 0.01);
    if (!verifyResult.verified) {
      return NextResponse.json({ error: verifyResult.error || 'Payment verification failed' }, { status: 400 });
    }

    // Server-side launch
    const umi = getPlatformUmi();
    
    const result = await createAndRegisterLaunch(umi, {}, {
      wallet: userPublicKey,
      launchType: 'bondingCurve',
      token: {
        name: tokenData.name,
        symbol: tokenData.symbol,
        image: tokenData.imageUrl,
        description: tokenData.description || '',
      },
      launch: { creatorFeeWallet: process.env.BONDING_CURVE_FEE_WALLET },
    } as any);

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

  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}