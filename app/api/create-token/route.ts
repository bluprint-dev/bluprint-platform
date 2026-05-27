import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUmi } from '@/app/lib/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import { redis } from '@/app/lib/redis';
import { Connection, PublicKey } from '@solana/web3.js';

export async function POST(req: NextRequest) {
  try {
    const { signature, userPublicKey, tokenData } = await req.json();

    if (!signature || !userPublicKey || !tokenData) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Verify payment first
    const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature, userPublicKey, expectedAmount: 0.01 }),
    });
    
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // 2. Rate limit check (IP + wallet)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateKey = `rate:create:${ip}:${userPublicKey}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) await redis.expire(rateKey, 60);
    if (rateCount > 3) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    // 3. Server-side launch
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

    // 4. Track launch
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