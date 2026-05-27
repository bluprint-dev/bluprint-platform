import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function GET(req: NextRequest) {
  try {
    // Token listesini al
    const tokenMints = await redis.smembers('bonding-curve:tokens');
    
    console.log('Token mints from Redis:', tokenMints);
    
    const tokens = [];
    const tokenMintsArray = Array.isArray(tokenMints) ? tokenMints : [];
    
    for (const mint of tokenMintsArray) {
      if (typeof mint !== 'string') continue;
      
      try {
        // Önce Redis'ten metadata'yı dene
        const metadataRaw = await redis.get(`token:metadata:${mint}`);
        console.log(`Metadata for ${mint}:`, metadataRaw);
        
        if (metadataRaw && typeof metadataRaw === 'string') {
          const metadata = JSON.parse(metadataRaw);
          tokens.push({
            mint,
            name: metadata.name || 'Unknown',
            symbol: metadata.symbol || '???',
            imageUrl: metadata.imageUrl || '',
            creator: metadata.creator || '',
            createdAt: metadata.createdAt || Date.now(),
          });
        } else {
          // Redis'te metadata yoksa Solscan API'den çek
          console.log(`Fetching metadata from Solscan for ${mint}...`);
          
          try {
            const solscanRes = await fetch(`https://public-api.solscan.io/token/meta?token=${mint}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
              },
            });
            
            if (solscanRes.ok) {
              const solscanData = await solscanRes.json();
              console.log(`Solscan data for ${mint}:`, solscanData);
              
              const tokenData = {
                mint,
                name: solscanData.name || 'Unknown',
                symbol: solscanData.symbol || '???',
                imageUrl: solscanData.icon || '',
                creator: solscanData.creator || '',
                createdAt: solscanData.createdAt || Date.now(),
              };
              
              tokens.push(tokenData);
              
              // Solscan'dan alınan veriyi Redis'e cache'le
              await redis.set(`token:metadata:${mint}`, JSON.stringify(tokenData), { ex: 3600 });
            } else {
              throw new Error('Solscan API returned error');
            }
          } catch (solscanError) {
            console.error(`Solscan fetch error for ${mint}:`, solscanError);
            // Fallback: sadece mint bilgisiyle ekle
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
      } catch (parseError) {
        console.error(`Error processing ${mint}:`, parseError);
        // Hatalı metadata'yı sil
        await redis.del(`token:metadata:${mint}`);
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
      total: tokenMintsArray.length,
    });
    
  } catch (error: any) {
    console.error('Tokens API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}