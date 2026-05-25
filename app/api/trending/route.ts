import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function GET() {
  try {
    // Upstash Redis'te zrange ile rev: true kullan
    const trending = await redis.zrange('trending:tokens', 0, 9, { rev: true });
    
    const result = [];
    if (Array.isArray(trending)) {
      for (let i = 0; i < trending.length; i++) {
        if (typeof trending[i] === 'string') {
          result.push({
            mint: trending[i],
          });
        }
      }
    }
    
    return NextResponse.json({ success: true, trending: result });
    
  } catch (error: any) {
    console.error('Trending error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}