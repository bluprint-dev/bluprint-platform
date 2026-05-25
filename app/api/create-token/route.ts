import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUmi } from '@/app/lib/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import { redis } from '@/app/lib/redis';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const CREATE_FEE_SOL = 0.01;

const FEE_DISTRIBUTION = [
  { address: 'aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x', percentage: 58 },
  { address: '2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc', percentage: 32 },
  { address: 'A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X', percentage: 10 },
];

const BONDING_CURVE_FEE_WALLET = 'Hn5UBz1BSDNzJVwbTx3KAK64gFBwtWoAaFbg2jCg6Vq5';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const description = formData.get('description') as string || '';
    const userPublicKey = formData.get('userPublicKey') as string;

    if (!name || !symbol || !imageUrl || !userPublicKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const userWallet = new PublicKey(userPublicKey);
    const totalFeeLamports = CREATE_FEE_SOL * 1_000_000_000;

    // 1. FEE TRANSACTION BUILD
    const feeTransaction = new Transaction();
    
    for (const dist of FEE_DISTRIBUTION) {
      const amount = Math.floor((totalFeeLamports * dist.percentage) / 100);
      if (amount > 0) {
        feeTransaction.add(
          SystemProgram.transfer({
            fromPubkey: userWallet,
            toPubkey: new PublicKey(dist.address),
            lamports: amount,
          })
        );
      }
    }

    const { blockhash } = await connection.getLatestBlockhash();
    feeTransaction.recentBlockhash = blockhash;
    feeTransaction.feePayer = userWallet;

    const feeTxBase64 = feeTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    // 2. TOKEN LAUNCH BUILD (imzasız - backend sadece hazırlıyor)
    const umi = getPlatformUmi();

    const tokenResult = await createAndRegisterLaunch(umi, {}, {
      wallet: userPublicKey,
      launchType: 'bondingCurve',
      token: {
        name,
        symbol,
        image: imageUrl,
        description,
      },
      launch: {
        creatorFeeWallet: BONDING_CURVE_FEE_WALLET,
      },
    } as any);

    const mintAddress = tokenResult.mintAddress;

    // 3. PENDING OLARAK KAYDET (henüz aktif değil)
    await redis.set(`pending-token:${mintAddress}`, JSON.stringify({
      userPublicKey,
      name,
      symbol,
      imageUrl,
      description,
      createdAt: Date.now(),
      status: 'pending',
    }));

    return NextResponse.json({
      success: true,
      mintAddress,
      feeTransaction: feeTxBase64,
      feeAmount: CREATE_FEE_SOL,
      launchLink: tokenResult.launch?.link,
    });
    
  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}