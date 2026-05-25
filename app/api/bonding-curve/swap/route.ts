import { NextRequest, NextResponse } from 'next/server';
import { publicKey } from '@metaplex-foundation/umi';
import { findAssociatedTokenPda, createAssociatedToken, syncNative } from '@metaplex-foundation/mpl-toolbox';
import { getPlatformUmi } from '@/app/lib/umi';
import { 
  findBondingCurveBucketV2Pda, 
  fetchBondingCurveBucketV2, 
  getSwapResult, 
  swapBondingCurveV2, 
  SwapDirection 
} from '@metaplex-foundation/genesis';
import { transactionBuilder } from '@metaplex-foundation/umi';

const WSOL_MINT = publicKey('So11111111111111111111111111111111111111112');

export async function POST(req: NextRequest) {
  try {
    const { mintAddress, amount, userPublicKey, isBuy } = await req.json();

    if (!mintAddress || !amount || !userPublicKey || isBuy === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const umi = getPlatformUmi();
    const mint = publicKey(mintAddress);
    const user = publicKey(userPublicKey);

    // 1. Bucket'ı bul
    const [bucketPda] = findBondingCurveBucketV2Pda(umi, { genesisAccount: mint, bucketIndex: 0 });
    const bucket = await fetchBondingCurveBucketV2(umi, bucketPda);

    // 2. ATA hesaplarını bul
    const [userBaseTokenAccount] = findAssociatedTokenPda(umi, { mint, owner: user });
    const [userQuoteTokenAccount] = findAssociatedTokenPda(umi, { mint: WSOL_MINT, owner: user });

    // 3. Alış işleminde wSOL hesabını hazırla
    if (isBuy) {
      const wrapTx = transactionBuilder()
        .add(createAssociatedToken(umi, { mint: WSOL_MINT, owner: user }))
        .add(syncNative(umi, { account: userQuoteTokenAccount }));
      await wrapTx.sendAndConfirm(umi);
    }

    // 4. Swap işlemi için gerekli değerler
    const amountIn = BigInt(amount);
    const direction = isBuy ? SwapDirection.Buy : SwapDirection.Sell;
    const quote = getSwapResult(bucket, amountIn, direction);

    // @ts-ignore - Tip uyumsuzluğu (direction parametresi bazı sürümlerde beklenmiyor)
    const swapResult = await swapBondingCurveV2(umi, {
      genesisAccount: mint,
      bucket: bucketPda,
      baseMint: mint,
      quoteMint: WSOL_MINT,
      baseTokenAccount: userBaseTokenAccount,
      quoteTokenAccount: userQuoteTokenAccount,
      amount: quote.amountIn,
    }).sendAndConfirm(umi);

    return NextResponse.json({
      success: true,
      signature: Buffer.from(swapResult.signature).toString('base64'),
      amountOut: quote.amountOut.toString(),
      fee: quote.fee.toString(),
      creatorFee: quote.creatorFee.toString(),
    });
  } catch (error: any) {
    console.error('Swap error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}