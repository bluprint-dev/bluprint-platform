import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import {
  genesis,
  findBondingCurveBucketV2Pda,
  fetchBondingCurveBucketV2,
  getSwapResult,
  SwapDirection,
} from '@metaplex-foundation/genesis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ FIX: 'mint' → 'genesisAccount'
    // Bonding curve PDA türetme ve bucket fetch için genesisAccount gerekir.
    // mint (SPL token adresi) burada kullanılmamalı.
    const genesisAccountStr = searchParams.get('genesisAccount');
    const amount = searchParams.get('amount');
    const isBuy = searchParams.get('isBuy') === 'true';

    if (!genesisAccountStr || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing genesisAccount or amount' },
        { status: 400 }
      );
    }

    const umi = createUmi(process.env.NEXT_PUBLIC_RPC_URL!).use(genesis());

    // ✅ FIX: genesisAccount ile PDA türet — mint ile değil
    const genesisAccount = publicKey(genesisAccountStr);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount,   // ✅ doğru
      bucketIndex: 0,
    });

    let bucket;
    try {
      bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch curve state — genesisAccount may be invalid' },
        { status: 400 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        { success: false, error: 'Curve not initialized' },
        { status: 404 }
      );
    }

    const amountIn = BigInt(amount);
    const direction = isBuy ? SwapDirection.Buy : SwapDirection.Sell;
    const quote = getSwapResult(bucket, amountIn, direction);

    return NextResponse.json({
      success: true,
      genesisAccount: genesisAccountStr,
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