import { NextRequest, NextResponse } from 'next/server';
import { redis, KEYS } from '@/app/lib/redis';

const ADMIN_WALLETS = [
  "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x",
  "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc",
];

function verifyAdminToken(req: NextRequest): boolean {
  // Bearer token kontrolü (page.tsx'in gönderdiği)
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const decoded = JSON.parse(atob(token));
      if (decoded.exp > Date.now() && ADMIN_WALLETS.includes(decoded.publicKey)) {
        return true;
      }
    } catch {}
  }

  // Fallback: x-wallet-address (eski yöntem)
  const wallet = req.headers.get('x-wallet-address');
  if (wallet && ADMIN_WALLETS.includes(wallet)) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tokenCount = Number(await redis.get(KEYS.tokenCount) || 0);
    const users = await redis.smembers(KEYS.users);
    const totalUsers = users.length;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const tokens = await redis.lrange(KEYS.tokens, 0, -1);
    let activeUsers = 0;
    let totalReferrals = 0;
    let totalPaidOut = 0;

    for (const token of tokens) {
      const t = JSON.parse(token);
      if (new Date(t.createdAt).getTime() > oneDayAgo) {
        activeUsers++;
      }
    }

    const allEarningsKeys = await redis.keys(`${KEYS.earnings}:*`);
    for (const key of allEarningsKeys) {
      const claimed = Number(await redis.hget(key, 'claimed') || 0);
      totalPaidOut += claimed;
      const referralsCount = await redis.scard(`${key}:referrals`);
      totalReferrals += referralsCount;
    }

    const totalRevenue = tokenCount * 0.10;
    const netProfit = totalRevenue - totalPaidOut;
    const yesterdayCount = Math.floor(tokenCount * 0.8);
    const dailyGrowth = tokenCount > 0 ? Math.floor((tokenCount - yesterdayCount) / yesterdayCount * 100) : 0;
    const weeklyGrowth = Math.min(100, dailyGrowth * 3);

    return NextResponse.json({
      success: true,
      stats: {
        totalTokens: tokenCount,
        totalUsers,
        activeUsers,
        totalEarnings: totalRevenue + totalPaidOut,
        totalReferrals,
        totalPaidOut,
        netProfit,
        dailyGrowth,
        weeklyGrowth,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}