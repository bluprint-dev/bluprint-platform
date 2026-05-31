// app/api/referral-leaderboard/route.ts
// Returns top 20 referrers by referral count.
// Key standard: ref:count:{wallet} -> int
// 5-10k safe: SCAN yerine sorted set kullanılıyor (O(log N))
// NOT: İlk kurulumda ref:leaderboard sorted set'i doldurmak için
//      create-token'da zadd çağrısı eklendi (aşağıda açıklandı).
//
// Fallback: sorted set yoksa ref:count:* keys üzerinden okur (yavaş ama çalışır)

import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // ── Fast path: sorted set (O(log N)) ──────────────────────────────
    // create-token her referralda ZADD ref:leaderboard {score} {wallet} yapıyor
    const top = await redis.zrange('ref:leaderboard', 0, 19, {
      rev: true,
      withScores: true,
    }) as (string | number)[];

    if (top && top.length > 0) {
      // Upstash zrange withScores: [member, score, member, score, ...]
      const leaderboard: { rank: number; wallet: string; referrals: number }[] = [];
      for (let i = 0; i < top.length; i += 2) {
        const wallet = top[i] as string;
        const score = Number(top[i + 1]);
        leaderboard.push({
          rank: leaderboard.length + 1,
          wallet,
          referrals: score,
        });
      }
      return NextResponse.json({ success: true, leaderboard });
    }

    // ── Fallback: scan ref:count:* keys (slower, for migration) ───────
    // Bu yol sadece sorted set henüz dolu değilse çalışır
    const keys = await redis.keys('ref:count:*');
    if (!keys || keys.length === 0) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    const entries = await Promise.all(
      keys.slice(0, 100).map(async (key: string) => {
        const wallet = key.replace('ref:count:', '');
        const count = parseInt((await redis.get(key) as string | null) ?? '0') || 0;
        return { wallet, referrals: count };
      })
    );

    const leaderboard = entries
      .filter((e) => e.referrals > 0)
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 20)
      .map((e, i) => ({ rank: i + 1, ...e }));

    return NextResponse.json({ success: true, leaderboard });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}