import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tfdmcuowasuakmcznpol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZG1jdW93YXN1YWttY3pucG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDEyMTUsImV4cCI6MjA5NjkxNzIxNX0.Ueem2OCrzG7kGNXCkTf5bfBk5JM1u5UEh2z4cvaPe5Y";

const ADMIN_WALLETS = [
  "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x",
  "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc",
];

function verifyAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = JSON.parse(atob(authHeader.slice(7)));
      if (decoded.exp > Date.now() && ADMIN_WALLETS.includes(decoded.publicKey)) return true;
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Redis verileri
    const [tokenCount, users, pendingKeys, countKeys, recentMints] = await Promise.all([
      redis.get('token:count'),
      redis.smembers('users'),
      redis.keys('ref:earnings:*:pending'),
      redis.keys('ref:count:*'),
      redis.lrange('recent_tokens', 0, 29),
    ]);

    // Referral kazançları
    let totalReferralEarnings = 0;
    if (pendingKeys.length > 0) {
      const vals = await Promise.all(pendingKeys.map(k => redis.get(k)));
      totalReferralEarnings = vals.reduce((sum: number, v) => sum + Number(v || 0), 0);
    }

    // Referral yapan kişi sayısı
    let totalReferralUsers = 0;
    if (countKeys.length > 0) {
      const vals = await Promise.all(countKeys.map(k => redis.get(k)));
      totalReferralUsers = vals.filter(v => Number(v) > 0).length;
    }

    // Top kazanan cüzdanlar
    const topReferrers: { wallet: string; earnings: number; referrals: number }[] = [];
    if (pendingKeys.length > 0) {
      const entries = await Promise.all(
        pendingKeys.map(async (k) => {
          const wallet = k.replace('ref:earnings:', '').replace(':pending', '');
          const [earnings, refs] = await Promise.all([
            redis.get(k),
            redis.get(`ref:count:${wallet}`),
          ]);
          return { wallet, earnings: Number(earnings || 0), referrals: Number(refs || 0) };
        })
      );
      topReferrers.push(...entries.sort((a, b) => b.earnings - a.earnings).slice(0, 10));
    }

    // Supabase: swap verileri
    const { data: allTrades } = await supabase
      .from('trades')
      .select('created_at, amount_sol, type')
      .order('created_at', { ascending: false });

    const trades = allTrades || [];
    const todayTrades = trades.filter(t => new Date(t.created_at) >= today);
    const totalSwapVolume = trades.reduce((s, t) => s + Number(t.amount_sol || 0), 0);
    const dailySwapVolume = todayTrades.reduce((s, t) => s + Number(t.amount_sol || 0), 0);
    const dailySwapCount = todayTrades.length;

    // Son tokenlar
    const recentTokens: { mint: string; name: string; symbol: string; createdAt: number }[] = [];
    for (const mint of recentMints.slice(0, 10)) {
      const mintStr = typeof mint === 'string' ? mint : String(mint);
      try {
        const meta = await redis.get(`token:metadata:${mintStr}`);
        const data = meta ? (typeof meta === 'string' ? JSON.parse(meta) : meta) : null;
        if (data) recentTokens.push({ mint: mintStr, name: data.name || '?', symbol: data.symbol || '?', createdAt: data.createdAt });
      } catch {}
    }

    // Platform geliri: token başına 0.1 SOL
    const totalTokens = Number(tokenCount || 0);
    const platformRevenue = totalTokens * 0.1;

    return NextResponse.json({
      success: true,
      stats: {
        totalTokens,
        totalUsers: users.length,
        totalReferralUsers,
        totalReferralEarnings: +totalReferralEarnings.toFixed(4),
        platformRevenue: +platformRevenue.toFixed(4),
        totalSwapVolume: +totalSwapVolume.toFixed(4),
        dailySwapVolume: +dailySwapVolume.toFixed(4),
        dailySwapCount,
        totalTrades: trades.length,
      },
      topReferrers,
      recentTokens,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}