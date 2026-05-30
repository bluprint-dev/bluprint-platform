import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

const MILESTONES = [
  { count: 10, bonus: 0.1 },
  { count: 25, bonus: 0.25 },
  { count: 50, bonus: 0.5 },
  { count: 100, bonus: 1.0 },
];

// =========================
// GET (READ ONLY VIEW)
// =========================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet required' },
        { status: 400 }
      );
    }

    // =========================
    // LOAD STATE (single source)
    // =========================
    const raw = await redis.get(`ref:state:${wallet}`);

    const state = raw
      ? typeof raw === 'string'
        ? JSON.parse(raw)
        : raw
      : {
          pending: 0,
          claimed: 0,
          referrals: [],
          milestonesClaimed: [],
        };

    const totalReferrals = state.referrals.length;

    // =========================
    // MILESTONES CALC
    // =========================
    const milestones = MILESTONES.map((m) => ({
      count: m.count,
      bonus: m.bonus,
      reached: totalReferrals >= m.count,
      claimed: state.milestonesClaimed.includes(m.count),
    }));

    const nextMilestone =
      MILESTONES.find((m) => totalReferrals < m.count) || null;

    return NextResponse.json({
      success: true,
      earnings: state.pending,
      claimed: state.claimed,
      totalReferrals,
      referrals: state.referrals,
      milestones,
      nextMilestone: nextMilestone?.count || null,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =========================
// POST (CLAIM SAFE)
// =========================
export async function POST(req: NextRequest) {
  try {
    const { wallet, amount } = await req.json();

    if (!wallet || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Wallet and amount required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const lockKey = `lock:claim:${wallet}`;

    // =========================
    // ATOMIC LOCK (SAFE)
    // =========================
    const lock = await redis.set(lockKey, '1', {
      nx: true,
      ex: 10,
    });

    if (!lock) {
      return NextResponse.json(
        { success: false, error: 'Claim already processing' },
        { status: 429 }
      );
    }

    try {
      const key = `ref:state:${wallet}`;

      const raw = await redis.get(key);

      const state = raw
        ? typeof raw === 'string'
          ? JSON.parse(raw)
          : raw
        : {
            pending: 0,
            claimed: 0,
            referrals: [],
            milestonesClaimed: [],
          };

      if (state.pending < amount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient earnings' },
          { status: 400 }
        );
      }

      // =========================
      // UPDATE STATE SAFELY
      // =========================
      state.pending -= amount;
      state.claimed += amount;

      await redis.set(key, JSON.stringify(state));

      return NextResponse.json({
        success: true,
        claimedAmount: amount,
        remainingPending: state.pending,
      });

    } finally {
      await redis.del(lockKey);
    }

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}