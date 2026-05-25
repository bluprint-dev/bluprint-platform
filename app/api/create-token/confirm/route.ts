import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { mintAddress, userPublicKey, signature } = await req.json();

    if (!mintAddress || !userPublicKey || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Pending token'ı kontrol et
    const pendingRaw = await redis.get(`pending-token:${mintAddress}`);
    if (!pendingRaw) {
      return NextResponse.json({ error: 'Token not found or already confirmed' }, { status: 404 });
    }

    const pending = typeof pendingRaw === 'string' ? JSON.parse(pendingRaw) : pendingRaw;
    
    // Token'ı aktif et
    await redis.set(`bonding-curve:creator:${mintAddress}`, userPublicKey);
    await redis.sadd('bonding-curve:tokens', mintAddress);
    
    // User'ın token set'ine ekle (top-users için optimize)
    await redis.sadd(`user:tokens:${userPublicKey}`, mintAddress);
    
    // Metadata cache
    await redis.set(`token:metadata:${mintAddress}`, JSON.stringify({
      name: pending.name,
      symbol: pending.symbol,
      imageUrl: pending.imageUrl,
      creator: userPublicKey,
      createdAt: pending.createdAt,
      signature,
    }));

    // Trending için
    await redis.zincrby('trending:tokens', 1, mintAddress);
    await redis.expire('trending:tokens', 86400);

    // Pending kaydını sil
    await redis.del(`pending-token:${mintAddress}`);

    console.log('✅ Token confirmed and activated:', mintAddress);

    return NextResponse.json({ success: true, mintAddress });
    
  } catch (error: any) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}