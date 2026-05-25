import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  genesis,
  findBondingCurveBucketV2Pda,
  fetchBondingCurveBucketV2,
  isSwappable,
  isSoldOut,
  isFirstBuyPending,
  getFillPercentage,
  isGraduated,
  getCurrentPrice,
  getCurrentPriceQuotePerBase,
  getCurrentPriceComponents,
  getSwapResult,
  SwapDirection,
} from '@metaplex-foundation/genesis';
import { publicKey } from '@metaplex-foundation/umi';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genesisAccountStr = searchParams.get('genesisAccount');

    if (!genesisAccountStr) {
      return NextResponse.json(
        { success: false, error: 'genesisAccount query param required' },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) throw new Error('NEXT_PUBLIC_RPC_URL not configured');

    const umi = createUmi(rpcUrl).use(genesis());
    const genesisAccount = publicKey(genesisAccountStr);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount,
      bucketIndex: 0,
    });

    const bucket = await fetchBondingCurveBucketV2(umi, bucketPda);

    const swappable = isSwappable(bucket);
    const soldOut = isSoldOut(bucket);
    const firstBuyPending = isFirstBuyPending(bucket);
    const fillPercent = getFillPercentage(bucket);
    const graduated = await isGraduated(umi, bucket);
    const priceTokensPerSol = getCurrentPrice(bucket);
    const priceLamportsPerToken = getCurrentPriceQuotePerBase(bucket);
    const { baseReserves, quoteReserves } = getCurrentPriceComponents(bucket);

    let buyQuote1Sol = null;
    if (swappable) {
      buyQuote1Sol = getSwapResult(bucket, BigInt(1000000000), SwapDirection.Buy);
    }

    // bucket üzerinde doğrudan erişilebilen alanlar
    const baseTokenBalance = (bucket as any).baseTokenBalance?.toString() || '0';
    const baseTokenAllocation = (bucket as any).baseTokenAllocation?.toString() || '0';
    const quoteTokenDepositTotal = (bucket as any).quoteTokenDepositTotal?.toString() || '0';
    const virtualSol = (bucket as any).virtualSol?.toString() || '0';
    const virtualTokens = (bucket as any).virtualTokens?.toString() || '0';

    return NextResponse.json({
      success: true,
      genesisAccount: genesisAccountStr,
      bucketPda: bucketPda.toString(),
      lifecycle: {
        isSwappable: swappable,
        isSoldOut: soldOut,
        isGraduated: graduated,
        isFirstBuyPending: firstBuyPending,
        fillPercent,
      },
      reserves: {
        baseTokenBalance,
        baseTokenAllocation,
        quoteTokenDepositTotal,
        virtualSol,
        virtualTokens,
        baseReserves: baseReserves.toString(),
        quoteReserves: quoteReserves.toString(),
      },
      price: {
        tokensPerSol: priceTokensPerSol.toString(),
        lamportsPerToken: priceLamportsPerToken.toString(),
      },
      fees: {
        depositFee: (bucket as any).depositFee,
        withdrawFee: (bucket as any).withdrawFee,
        creatorFeeAccrued: bucket.creatorFeeAccrued.toString(),
        creatorFeeClaimed: (bucket as any).creatorFeeClaimed?.toString() || '0',
      },
      example: buyQuote1Sol
        ? {
            buy1Sol: {
              amountIn: buyQuote1Sol.amountIn.toString(),
              amountOut: buyQuote1Sol.amountOut.toString(),
              fee: buyQuote1Sol.fee.toString(),
              creatorFee: buyQuote1Sol.creatorFee.toString(),
            },
          }
        : null,
    });
  } catch (err: any) {
    console.error('Info error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}