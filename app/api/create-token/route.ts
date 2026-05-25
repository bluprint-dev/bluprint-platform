import { NextRequest, NextResponse } from 'next/server';
import { getPlatformUmi } from '@/app/lib/umi';
import { createAndRegisterLaunch } from '@metaplex-foundation/genesis';
import Irys from '@irys/sdk';
import { redis } from '@/app/lib/redis';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

// ============================================
// CREATE TOKEN FEE DAĞITIM KONFİGÜRASYONU
// ============================================
const CREATE_FEE_SOL = 0.02;

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
    const userPublicKey = formData.get('userPublicKey') as string;

    if (!name || !symbol || !userPublicKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, symbol, userPublicKey' 
      }, { status: 400 });
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const userWallet = new PublicKey(userPublicKey);
    const totalFeeLamports = CREATE_FEE_SOL * 1_000_000_000;

    // ============================================
    // 1. LOGO YÜKLEME (Irys)
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
        console.log('✅ Logo uploaded to Irys:', imageUrl);
        
      } catch (irysError) {
        console.error('❌ Irys upload failed:', irysError);
      }
    }

    // ============================================
    // 2. BONDING CURVE TOKEN OLUŞTUR
    // ============================================
    const umi = getPlatformUmi();

    const tokenResult = await createAndRegisterLaunch(umi, {}, {
      wallet: userPublicKey,
      launchType: 'bondingCurve',
      token: {
        name,
        symbol,
        image: imageUrl,
        description: formData.get('description') as string || '',
      },
      launch: {
        creatorFeeWallet: BONDING_CURVE_FEE_WALLET,
      },
    } as any);

    const mintAddress = tokenResult.mintAddress;

    // ============================================
    // 3. FEE TRANSACTION'INI HAZIRLA
    // ============================================
    const feeTransaction = new Transaction();
    
    for (const dist of CREATE_FEE_DISTRIBUTION) {
      const amount = (totalFeeLamports * dist.percentage) / 100;
      const destinationWallet = new PublicKey(dist.address);
      
      feeTransaction.add(
        SystemProgram.transfer({
          fromPubkey: userWallet,
          toPubkey: destinationWallet,
          lamports: amount,
        })
      );
    }

    // Blockhash ve fee payer ayarla
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    feeTransaction.recentBlockhash = blockhash;
    feeTransaction.lastValidBlockHeight = lastValidBlockHeight;
    feeTransaction.feePayer = userWallet;

    // Transaction'ı serialize et (partial - kullanıcı imzalayacak)
    const serializedFeeTransaction = feeTransaction.serialize({ requireAllSignatures: false });
    const feeTransactionBase64 = serializedFeeTransaction.toString('base64');

    // ============================================
    // 4. REDIS'E KAYDET
    // ============================================
    await redis.set(`bonding-curve:creator:${mintAddress}`, userPublicKey);
    await redis.sadd('bonding-curve:tokens', mintAddress);
    
    await redis.set(`create-fee-distribution:${mintAddress}`, JSON.stringify({
      distribution: CREATE_FEE_DISTRIBUTION,
      totalFee: CREATE_FEE_SOL,
      timestamp: Date.now(),
    }));

    console.log('✅ Token created:', {
      mintAddress,
      name,
      symbol,
    });

    return NextResponse.json({
      success: true,
      mintAddress,
      launchLink: tokenResult.launch.link,
      feeTransaction: feeTransactionBase64,
      feeAmount: CREATE_FEE_SOL,
    });
    
  } catch (error: any) {
    console.error('❌ Create token error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.toString(),
    }, { status: 500 });
  }
}