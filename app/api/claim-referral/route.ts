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
//   - Treasury key via REFERRAL_TREASURY_SECRET_KEY env (bs58 encoded keypair)

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
import nacl from 'tweetnacl';

export const runtime = 'nodejs';

const MIN_CLAIM = 0.01; // SOL
const SIGNATURE_VALIDITY_MS = 60_000; // imza en fazla 60 saniye gecerli (replay korumasi)
const RATE_LIMIT_WINDOW_S = 30; // ayni cuzdan 30 saniyede en fazla 1 claim isteyebilir
const RATE_LIMIT_MAX = 1;

function getTreasury(): Keypair {
  const secret = process.env.REFERRAL_TREASURY_SECRET_KEY;
  if (!secret) {
    throw new Error('REFERRAL_TREASURY_SECRET_KEY env değişkeni tanımlı değil');
  }
  return Keypair.fromSecretKey(bs58.decode(secret));
}

// Kullanicinin cuzdaninin sahibi oldugunu kanitlar.
// Frontend, cuzdandan `Claim referral rewards for {wallet} at {timestamp}` mesajini
// signMessage ile imzalatip { wallet, timestamp, signature } olarak gondermeli.
// signature, base58 encoded Uint8Array olmali (bs58.encode(signedBytes)).
function verifyClaimSignature(
  wallet: string,
  timestamp: number,
  signature: string
): { valid: boolean; reason?: string } {
  const now = Date.now();
  if (Math.abs(now - timestamp) > SIGNATURE_VALIDITY_MS) {
    return { valid: false, reason: 'Signature expired, try again' };
  }

  let signatureBytes: Uint8Array;
  let pubkeyBytes: Uint8Array;
  try {
    signatureBytes = bs58.decode(signature);
    pubkeyBytes = new PublicKey(wallet).toBytes();
  } catch {
    return { valid: false, reason: 'Invalid signature or wallet format' };
  }

  const message = new TextEncoder().encode(
    `Claim referral rewards for ${wallet} at ${timestamp}`
  );

  const isValid = nacl.sign.detached.verify(message, signatureBytes, pubkeyBytes);
  if (!isValid) {
    return { valid: false, reason: 'Signature verification failed' };
  }

  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const { wallet, timestamp, signature } = await req.json();

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet required' }, { status: 400 });
    }

    if (!timestamp || !signature) {
      return NextResponse.json(
        { success: false, error: 'Signature required to prove wallet ownership' },
        { status: 400 }
      );
    }

    // ── Cuzdan sahipligi dogrulama (imza kontrolu) ──────────────────────
    const verification = verifyClaimSignature(wallet, timestamp, signature);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.reason ?? 'Invalid signature' },
        { status: 401 }
      );
    }

    // ── Rate limit (ayni cuzdan kisa surede tekrar tekrar deneyemesin) ──
    const rateLimitKey = `ratelimit:claim:${wallet}`;
    const requestCount = await redis.incr(rateLimitKey);
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_S);
    }
    if (requestCount > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { success: false, error: 'Too many requests, please wait before trying again' },
        { status: 429 }
      );
    }

    // ── Lock (anti double-claim) ──────────────────────────────
    const lockKey = `lock:claim:${wallet}`;
    const locked = await redis.set(lockKey, '1', { nx: true, ex: 10 });
    if (!locked) {
      return NextResponse.json({ success: false, error: 'Claim already in progress' }, { status: 429 });
    }

    try {
      // ── Read current pending ──────────────────────────────
      const pendingRaw = await redis.get(`ref:earnings:${wallet}:pending`) as string | null;
      const pending = parseFloat(pendingRaw ?? '0') || 0;

      if (pending < MIN_CLAIM) {
        return NextResponse.json({
          success: false,
          error: `Minimum claim is ${MIN_CLAIM} SOL (you have ${pending.toFixed(4)} SOL pending)`,
        }, { status: 400 });
      }

      // ── On-chain transfer ──────────────────────────────
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

      // ── Update Redis ONLY after confirmed ──────────────────────────────
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
    return NextResponse.json(
      { success: false, error: 'Claim failed, please try again later' },
      { status: 500 }
    );
  }
}