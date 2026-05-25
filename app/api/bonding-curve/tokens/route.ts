import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const tokenMints = await redis.smembers('bonding-curve:tokens');
    const tokenList = Array.isArray(tokenMints) ? tokenMints : [];
    const reversed = tokenList.reverse();
    const paginated = reversed.slice(offset, offset + limit);
    
    const tokens = [];
    
    for (const mint of paginated) {
      if (typeof mint === 'string') {
        const metadataRaw = await redis.get(`token:metadata:${mint}`);
        if (metadataRaw && typeof metadataRaw === 'string') {
          const metadata = JSON.parse(metadataRaw);
          tokens.push({
            mint,
            ...metadata,
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      tokens,
      total: tokenList.length,
    });
    
  } catch (error: any) {
    console.error('Tokens error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}