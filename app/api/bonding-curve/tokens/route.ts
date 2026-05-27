import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function GET(req: NextRequest) {
  try {
    // Token listesini al
    const tokenMints = await redis.smembers('bonding-curve:tokens');
    
    // Log için
    console.log('Token mints from Redis:', tokenMints);
    
    const tokens = [];
    
    for (const mint of tokenMints) {
      if (typeof mint !== 'string') continue;
      
      try {
        const metadataRaw = await redis.get(`token:metadata:${mint}`);
        console.log(`Metadata for ${mint}:`, metadataRaw);
        
        if (metadataRaw && typeof metadataRaw === 'string') {
          const metadata = JSON.parse(metadataRaw);
          tokens.push({
            mint,
            ...metadata,
          });
        } else {
          // Metadata yoksa sadece mint'i ekle
          tokens.push({
            mint,
            name: 'Unknown',
            symbol: '???',
            imageUrl: '',
            creator: '',
            createdAt: Date.now(),
          });
        }
      } catch (parseError) {
        console.error(`Error parsing metadata for ${mint}:`, parseError);
        // Hatalı metadata'yı sil
        await redis.del(`token:metadata:${mint}`);
        // Sadece mint'i ekle
        tokens.push({
          mint,
          name: 'Unknown',
          symbol: '???',
          imageUrl: '',
          creator: '',
          createdAt: Date.now(),
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      tokens,
      total: tokenMints.length,
    });
    
  } catch (error: any) {
    console.error('Tokens API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}