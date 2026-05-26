import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const IRYS_FEE_SOL = 0.0001;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userPublicKey = formData.get('userPublicKey') as string;

    if (!file || !userPublicKey) {
      return NextResponse.json({ error: 'Missing file or userPublicKey' }, { status: 400 });
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const userWallet = new PublicKey(userPublicKey);
    const platformWallet = new PublicKey(process.env.PLATFORM_PUBLIC_KEY!);
    
    const feeLamports = Math.floor(IRYS_FEE_SOL * 1_000_000_000);
    
    const feeTransaction = new Transaction();
    feeTransaction.add(
      SystemProgram.transfer({
        fromPubkey: userWallet,
        toPubkey: platformWallet,
        lamports: feeLamports,
      })
    );
    
    const { blockhash } = await connection.getLatestBlockhash();
    feeTransaction.recentBlockhash = blockhash;
    feeTransaction.feePayer = userWallet;
    
    const serializedFeeTx = feeTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).toString('base64');
    
    // ⚠️ Irys yükleme KALDIRILDI - frontend'de yapılacak
    // Backend sadece fee transaction'ı hazırlıyor
    
    // Varsayılan resim döndür (geçici)
    const imageUrl = "https://gateway.irys.xyz/default-token-logo.png";
    
    return NextResponse.json({
      success: true,
      imageUrl,
      id: "default",
      feeTransaction: serializedFeeTx,
      feeAmount: IRYS_FEE_SOL,
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}