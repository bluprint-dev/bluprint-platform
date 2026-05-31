// app/api/generate-promocode/route.ts
// Called after successful token creation to unlock the creator's referral code.
// Key standard:
//   ref:user:{wallet}  -> code   (wallet'ın kodu)
//   ref:code:{code}    -> wallet (kodun sahibi)
//
// 5-10k user safe:
//   - Idempotent: mevcut kod varsa yeni üretmez
//   - Collision-resistant: 7 char = 34^7 = ~52B kombinasyon, while loop maks 5 deneme

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export const runtime = 'nodejs';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; // I ve O yok (karışıklık)
const CODE_LENGTH = 7;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// GET: wallet'ın mevcut kodunu döner
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ success: false, error: 'Wallet required' }, { status: 400 });
  }

  try {
    const code = await redis.get(`ref:user:${wallet}`) as string | null;
    return NextResponse.json({ success: true, hasCode: !!code, code: code ?? null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST: token launch sonrası çağrılır, kod yoksa üretir (idempotent)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // create page "wallet" gönderiyor, eski kod "walletAddress" gönderiyordu — ikisini de destekle
    const wallet: string | undefined = body.wallet ?? body.walletAddress;

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet required' }, { status: 400 });
    }

    // Idempotent: zaten kod varsa aynen dön
    const existing = await redis.get(`ref:user:${wallet}`) as string | null;
    if (existing) {
      return NextResponse.json({ success: true, code: existing, isNew: false });
    }

    // Collision-resistant unique code üret
    let newCode: string | null = null;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const candidate = generateCode();
      // SET NX: sadece yoksa yaz (atomic)
      const set = await redis.set(`ref:code:${candidate}`, wallet, { nx: true });
      if (set) {
        newCode = candidate;
        break;
      }
    }

    if (!newCode) {
      // Son derece nadir — 5 çakışma üst üste
      return NextResponse.json({ success: false, error: 'Code generation failed, retry' }, { status: 500 });
    }

    // Wallet -> code mapping
    await redis.set(`ref:user:${wallet}`, newCode);

    return NextResponse.json({ success: true, code: newCode, isNew: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}