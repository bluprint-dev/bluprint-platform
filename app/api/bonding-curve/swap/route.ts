import { NextRequest, NextResponse } from 'next/server';
import { publicKey } from '@metaplex-foundation/umi';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { getPlatformUmi } from '@/app/lib/umi';
import { 
  findBondingCurveBucketV2Pda, 
  fetchBondingCurveBucketV2, 
  getSwapResult, 
  swapBondingCurveV2,
  SwapDirection
} from '@metaplex-foundation/genesis';
import { Connection } from '@solana/web3.js';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export async function POST(req: NextRequest) {
  try {
    const { mintAddress, amount, userPublicKey, isBuy } = await req.json();

    if (!mintAddress || !amount || !userPublicKey || isBuy === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const umi = getPlatformUmi();
    const umiMint = publicKey(mintAddress);
    const umiUser = publicKey(userPublicKey);
    const umiWSOL = publicKey(WSOL_MINT);

    // Bucket
    const [bucketPda] = findBondingCurveBucketV2Pda(umi, { 
      genesisAccount: umiMint, 
      bucketIndex: 0 
    });
    const bucket = await fetchBondingCurveBucketV2(umi, bucketPda);

    // ATA'lar
    const [userBaseTokenAccount] = findAssociatedTokenPda(umi, { 
      mint: umiMint, 
      owner: umiUser 
    });
    const [userQuoteTokenAccount] = findAssociatedTokenPda(umi, { 
      mint: umiWSOL, 
      owner: umiUser 
    });

    // Direction + Quote
    const direction = isBuy ? SwapDirection.Buy : SwapDirection.Sell;
    const amountBigInt = BigInt(amount);
    const quote = getSwapResult(bucket, amountBigInt, direction);

    // %1 slippage toleransı
    const slippageNumerator = BigInt(99);
    const slippageDenominator = BigInt(100);
    const minAmountOutScaled = (quote.amountOut * slippageNumerator) / slippageDenominator;

    // Builder - minAmountOutScaled ZORUNLU
    const swapBuilder = swapBondingCurveV2(umi, {
      genesisAccount: umiMint,
      bucket: bucketPda,
      baseMint: umiMint,
      quoteMint: umiWSOL,
      baseTokenAccount: userBaseTokenAccount,
      quoteTokenAccount: userQuoteTokenAccount,
      quoteTokenOwner: umiUser,
      baseTokenOwner: umiUser,
      swapDirection: direction,
      amount: quote.amountIn,
      minAmountOutScaled: minAmountOutScaled,  // ✅ ZORUNLU
    });

    // Build
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    const umiTx = await swapBuilder.setBlockhash(blockhash).build(umi);

    // Serialize
    const serializedTx = Buffer.from(
      umi.transactions.serialize(umiTx)
    ).toString('base64');

    return NextResponse.json({
      success: true,
      transaction: serializedTx,
      amountOut: quote.amountOut.toString(),
      amountIn: quote.amountIn.toString(),
      fee: quote.fee?.toString() || '0',
      creatorFee: quote.creatorFee?.toString() || '0',
      lastValidBlockHeight,
    });

  } catch (error: any) {
    console.error('Swap build error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}