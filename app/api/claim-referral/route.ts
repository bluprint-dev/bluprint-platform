import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { redis } from '@/app/lib/redis';

const WALLET_FILE = process.env.WALLET_SECRET; // öneri: file yerine env

function getTreasuryWallet(): Keypair {
  const secretKey = JSON.parse(WALLET_FILE!);
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

function getKey(wallet: string) {
  return {
    earnings: `earnings:${wallet}`,
    lock: `lock:claim:${wallet}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { wallet, amount } = await req.json();

    if (!wallet || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const keys = getKey(wallet);

    // 🔒 LOCK (anti double claim)
    const lock = await redis.set(keys.lock, '1', { nx: true, ex: 10 });
    if (!lock) {
      return NextResponse.json({ error: 'Claim in progress' }, { status: 429 });
    }

    try {
      // 🧠 ATOMIC DATA READ
      const raw = await redis.get(keys.earnings);

      const data = raw
        ? typeof raw === 'string'
          ? JSON.parse(raw)
          : raw
        : { pending: 0, claimed: 0, referrals: [] };

      if ((data.pending || 0) < amount) {
        return NextResponse.json({ error: 'Insufficient earnings' }, { status: 400 });
      }

      // 💰 SOLANA TRANSFER
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL!,
        'confirmed'
      );

      const treasury = getTreasuryWallet();
      const to = new PublicKey(wallet);

      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey: to,
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = treasury.publicKey;

      tx.sign(treasury);

      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, 'confirmed');

      // 🧾 STATE UPDATE (ONLY AFTER SUCCESS)
      data.pending -= amount;
      data.claimed += amount;

      await redis.set(keys.earnings, JSON.stringify(data));

      return NextResponse.json({
        success: true,
        amount,
        signature: sig,
      });

    } finally {
      // 🔓 ALWAYS RELEASE LOCK
      await redis.del(keys.lock);
    }

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}