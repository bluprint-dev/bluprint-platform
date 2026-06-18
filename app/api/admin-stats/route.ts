import { NextRequest, NextResponse } from 'next/server';
import { redis, KEYS } from '@/app/lib/redis';

const ADMIN_WALLETS = [
  "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x",
  "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc",
];

function verifyAdminToken(req: NextRequest): boolean {
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
  const wallet = req.headers.get('x-wallet-address');
  if (wallet && ADMIN_WALLETS.includes(wallet)) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Token sayısı
    const tokenCount = Number(await redis.get(KEYS.tokenCount) || 0);

    // Kullanıcılar
    const users = await redis.smembers(KEYS.users);
    const totalUsers = users.length;

    // Son 24 saatte aktif kullanıcılar (track-token key'inden)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentTokenMints = await redis.lrange('recent_tokens', 0, 99);
    let activeUsers = 0;
    const seenWallets = new Set<string>();

    for (const mint of recentTokenMints) {
      const mintStr = typeof mint === 'string' ? mint : String(mint);
      try {
        const meta = await redis.get(`token:metadata:${mintStr}`);
        const data = meta
          ? (typeof meta === 'string' ? JSON.parse(meta) : meta)
          : null;
        if (data?.createdAt && data.createdAt > oneDayAgo && data.creator && !seenWallets.has(data.creator)) {
          seenWallets.add(data.creator);
          activeUsers++;
        }
      } catch {}
    }

    // Referral istatistikleri — gerçek key'ler: ref:earnings:*:pending, ref:count:*
    let totalReferrals = 0;
    let totalPaidOut = 0;

    const pendingKeys = await redis.keys('ref:earnings:*:pending');
    for (const key of pendingKeys) {
      const val = Number(await redis.get(key) || 0);
      totalPaidOut += val;
    }

    const countKeys = await redis.keys('ref:count:*');
    for (const key of countKeys) {
      const val = Number(await redis.get(key) || 0);
      totalReferrals += val;
    }

    const totalRevenue = tokenCount * 0.10;
    const netProfit = totalRevenue - totalPaidOut;

    // Büyüme hesabı (track-token listesinden)
    const allTokens = await redis.lrange(KEYS.tokens, 0, -1);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let thisWeek = 0;
    let lastWeek = 0;
    for (const t of allTokens) {
      const data = typeof t === 'string' ? JSON.parse(t) : t;
      const ts = new Date(data.createdAt).getTime();
      if (ts > oneDayAgo) thisWeek++;
      else if (ts > weekAgo) lastWeek++;
    }
    const dailyGrowth = lastWeek > 0 ? Math.floor((thisWeek - lastWeek) / lastWeek * 100) : 0;
    const weeklyGrowth = Math.min(100, Math.abs(dailyGrowth));

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