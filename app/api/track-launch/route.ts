import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { mintAddress, name, symbol, imageUrl, userPublicKey, signature } = await req.json();

    if (!mintAddress || !userPublicKey || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Rate limit: Aynı kullanıcı 5 dakikada max 3 token
    const userRateLimit = await redis.incr(`rate-limit:${userPublicKey}`);
    if (userRateLimit === 1) {
      await redis.expire(`rate-limit:${userPublicKey}`, 300);
    }
    if (userRateLimit > 3) {
      return NextResponse.json({ error: 'Rate limit exceeded. Wait 5 minutes.' }, { status: 429 });
    }

    // Anti-spam: Aynı mint adresi tekrar kaydedilemez
    const existing = await redis.get(`bonding-curve:creator:${mintAddress}`);
    if (existing) {
      return NextResponse.json({ error: 'Token already exists' }, { status: 400 });
    }

    // Token'ı kaydet
    await redis.set(`bonding-curve:creator:${mintAddress}`, userPublicKey);
    await redis.sadd('bonding-curve:tokens', mintAddress);
    
    // Metadata cache
    await redis.set(`token:metadata:${mintAddress}`, JSON.stringify({
      name,
      symbol,
      imageUrl,
      creator: userPublicKey,
      createdAt: Date.now(),
      signature,
    }));

    // Trending için (son 24 saat)
    await redis.zincrby('trending:tokens', 1, mintAddress);
    await redis.expire('trending:tokens', 86400);

    console.log('✅ Token tracked:', mintAddress);

    return NextResponse.json({ success: true, mintAddress });
    
  } catch (error: any) {
    console.error('Track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}