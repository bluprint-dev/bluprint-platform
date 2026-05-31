// app/api/claim-referral/route.ts
// Transfers pending earnings from treasury to user wallet.
// Key standard (matches create-token & referral-earnings):
//   ref:earnings:{wallet}:pending  -> incrbyfloat
//   ref:earnings:{wallet}:claimed  -> incrbyfloat
//
// Safety:
//   - Redis NX lock (10s TTL) prevents double-claim
//   - State updated ONLY after on-chain confirmation
//   - Minimum claim: 0.01 SOL (avoid dust txs)
//   - Treasury key via PLATFORM_SECRET_KEY env (bs58 encoded keypair)

import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
} from '@solana/web3.js';
import { redis } from '@/app/lib/redis';
import bs58 from 'bs58';

export const runtime = 'nodejs';

const MIN_CLAIM = 0.01; // SOL

function getTreasury(): Keypair {
  const secret = process.env.PLATFORM_SECRET_KEY!;
  // bs58 encoded (same as umi.ts)
  return Keypair.fromSecretKey(bs58.decode(secret));
}

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet required' }, { status: 400 });
    }

    // ── Lock (anti double-claim) ──────────────────────────────────────────
    const lockKey = `lock:claim:${wallet}`;
    const locked = await redis.set(lockKey, '1', { nx: true, ex: 10 });
    if (!locked) {
      return NextResponse.json({ success: false, error: 'Claim already in progress' }, { status: 429 });
    }

    try {
      // ── Read current pending ──────────────────────────────────────────
      const pendingRaw = await redis.get(`ref:earnings:${wallet}:pending`) as string | null;
      const pending = parseFloat(pendingRaw ?? '0') || 0;

      if (pending < MIN_CLAIM) {
        return NextResponse.json({
          success: false,
          error: `Minimum claim is ${MIN_CLAIM} SOL (you have ${pending.toFixed(4)} SOL pending)`,
        }, { status: 400 });
      }

      // ── On-chain transfer ─────────────────────────────────────────────
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, 'confirmed');
      const treasury = getTreasury();
      const toPubkey = new PublicKey(wallet);
      const lamports = Math.floor(pending * LAMPORTS_PER_SOL);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: treasury.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey,
          lamports,
        })
      );

      tx.sign(treasury);

      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

      // ── Update Redis ONLY after confirmed ────────────────────────────
      // Deduct pending, add to claimed (atomic via pipeline)
      await Promise.all([
        redis.incrbyfloat(`ref:earnings:${wallet}:pending`, -pending),
        redis.incrbyfloat(`ref:earnings:${wallet}:claimed`, pending),
      ]);

      return NextResponse.json({
        success: true,
        amount: pending,
        signature: sig,
      });

    } finally {
      // Always release lock
      await redis.del(lockKey);
    }

  } catch (err: any) {
    console.error('CLAIM_ERROR:', err);
    return NextResponse.json({ success: false, error: err.message ?? 'Server error' }, { status: 500 });
  }
}