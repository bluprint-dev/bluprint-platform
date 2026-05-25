import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { genesis, findBondingCurveBucketV2Pda, fetchBondingCurveBucketV2, getSwapResult, SwapDirection } from '@metaplex-foundation/genesis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mint = searchParams.get('mint');
    const amount = searchParams.get('amount');
    const isBuy = searchParams.get('isBuy') === 'true';

    if (!mint || !amount) {
      return NextResponse.json({ success: false, error: 'Missing mint or amount' }, { status: 400 });
    }

    const umi = createUmi(process.env.NEXT_PUBLIC_RPC_URL!).use(genesis());
    const mintPubkey = publicKey(mint);
    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount: mintPubkey,
      bucketIndex: 0,
    });
    const bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    const amountIn = BigInt(amount);
    const direction = isBuy ? SwapDirection.Buy : SwapDirection.Sell;
    const quote = getSwapResult(bucket, amountIn, direction);

    return NextResponse.json({
      success: true,
      quote: {
        amountOut: quote.amountOut.toString(),
        fee: quote.fee.toString(),
        creatorFee: quote.creatorFee.toString(),
      },
    });
  } catch (error: any) {
    console.error('Quote error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}