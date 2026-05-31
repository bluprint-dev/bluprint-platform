// app/api/promo/code/route.ts
// Validates a promo code for the create page
// Key standard: ref:code:{CODE} -> wallet

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code || code.trim().length < 4) {
    return NextResponse.json({ valid: false, error: 'Code required' }, { status: 400 });
  }

  try {
    const normalized = code.trim().toUpperCase();
    const ownerWallet = await redis.get(`ref:code:${normalized}`) as string | null;

    if (!ownerWallet) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, owner: ownerWallet });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}