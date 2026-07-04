import { NextRequest, NextResponse } from 'next/server';
import { redis, KEYS } from '@/app/lib/redis';

export async function GET(req: NextRequest) {
  try {
    // Boost'ları Redis'ten al (sorted set ile tutuyorsan)
    // Veya token listesinden boost sayısına göre sırala
    
    // Geçici olarak örnek veri (gerçek veri gelince değişecek)
    const sampleBoostTokens = [
      {
        id: "1",
        mint: "8nz5eem3n5wa",
        name: "Sample Token",
        symbol: "SMPL",
        image: "",
        boostCount: 15
      },
      {
        id: "2",
        mint: "7UyFuQfftyLg",
        name: "Axor Token",
        symbol: "BLUEP",
        image: "",
        boostCount: 8
      }
    ];
    
    // Gerçek veri için Redis'ten boost'ları çek
    // const boostTokens = await redis.zrevrange(KEYS.boostLeaderboard, 0, 9, { withScores: true });
    
    return NextResponse.json({
      success: true,
      tokens: sampleBoostTokens
    });
  } catch (error: any) {
    console.error("Boost tokens error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}