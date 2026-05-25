import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function GET() {
  try {
    const userKeys = await redis.keys('user:tokens:*');
    
    const userStats = [];
    for (const key of userKeys) {
      const wallet = key.replace('user:tokens:', '');
      const tokenCount = await redis.scard(key);
      
      if (tokenCount > 0) {
        userStats.push({ wallet, tokenCount });
      }
    }
    
    userStats.sort((a, b) => b.tokenCount - a.tokenCount);
    
    return NextResponse.json({ success: true, users: userStats.slice(0, 20) });
    
  } catch (error: any) {
    console.error('Top users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}