import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUmi } from '@/app/lib/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import Irys from '@irys/sdk';
import { redis } from '@/app/lib/redis';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const CREATE_FEE_SOL = 0.01;

const CREATE_FEE_DISTRIBUTION = [
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
    const logoFile = formData.get('logo') as File | null;
    const description = formData.get('description') as string || '';
    const userPublicKey = formData.get('userPublicKey') as string;

    if (!name || !symbol || !userPublicKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const userWallet = new PublicKey(userPublicKey);
    const totalFeeLamports = CREATE_FEE_SOL * 1_000_000_000;

    // ============================================
    // 1. LOGO YÜKLE (Irys)
    // ============================================
    let imageUrl = "https://gateway.irys.xyz/default-token-logo.png";
    
    if (logoFile && logoFile.size > 0) {
      try {
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const secretKeyArray = JSON.parse(process.env.PLATFORM_SECRET_KEY!);
        
        const irys = new Irys({
          network: 'mainnet',
          token: 'solana',
          key: secretKeyArray,
        });
        
        const receipt = await irys.upload(buffer, {
          tags: [{ name: 'Content-Type', value: logoFile.type }],
        });
        
        imageUrl = `https://gateway.irys.xyz/${receipt.id}`;
      } catch (err) {
        console.error('Irys error:', err);
      }
    }

    // ============================================
    // 2. FEE TRANSACTION BUILD (İmzasız)
    // ============================================
    const feeTransaction = new Transaction();
    
    for (const dist of CREATE_FEE_DISTRIBUTION) {
      const amount = Math.floor((totalFeeLamports * dist.percentage) / 100);
      feeTransaction.add(
        SystemProgram.transfer({
          fromPubkey: userWallet,
          toPubkey: new PublicKey(dist.address),
          lamports: amount,
        })
      );
    }

    const { blockhash } = await connection.getLatestBlockhash();
    feeTransaction.recentBlockhash = blockhash;
    feeTransaction.feePayer = userWallet;

    const feeTxBase64 = feeTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');

    // ============================================
    // 3. TOKEN OLUŞTUR (Backend imzalıyor - geçici çözüm)
    // ============================================
    // NOT: Metaplex Genesis SDK'sı transaction build etmeyi direkt desteklemiyor.
    // Bu nedenle token oluşturma işlemini backend yapıyor, fee'yi frontend alıyor.
    
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

    // Token'ı geçici olarak Redis'e kaydet (fee ödenince onaylanacak)
    await redis.set(`pending-token:${mintAddress}`, JSON.stringify({
      userPublicKey,
      name,
      symbol,
      imageUrl,
      createdAt: Date.now(),
    }));

    return NextResponse.json({
      success: true,
      mintAddress,
      feeTransaction: feeTxBase64,
      feeAmount: CREATE_FEE_SOL,
      launchLink: tokenResult.launch?.link,
    });
    
  } catch (error: any) {
    console.error('Build error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}