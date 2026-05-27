import { NextRequest, NextResponse } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
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
} from "@metaplex-foundation/genesis";
import { publicKey } from "@metaplex-foundation/umi";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genesisAccountStr =
      searchParams.get("genesisAccount");

    if (!genesisAccountStr) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing genesisAccount",
        },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    if (!rpcUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "RPC not configured",
        },
        { status: 500 }
      );
    }

    const umi = createUmi(rpcUrl).use(genesis());

    const genesisAccount = publicKey(genesisAccountStr);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount,
      bucketIndex: 0,
    });

    let bucket;

    try {
      bucket = await fetchBondingCurveBucketV2(
        umi,
        bucketPda
      );
    } catch (e) {
      return NextResponse.json({
        success: false,
        state: "RPC_ERROR",
        error: "Failed to fetch curve state",
      });
    }

    // 🔴 SAFE STATE (CRITICAL FOR 500 ELIMINATION)
    if (!bucket) {
      return NextResponse.json({
        success: true,
        state: "NOT_INITIALIZED",
        lifecycle: {
          isSwappable: false,
          isSoldOut: false,
          isGraduated: false,
          isFirstBuyPending: true,
          fillPercent: 0,
        },
        reserves: null,
        price: null,
        example: null,
      });
    }

    // ----------------------------
    // LIFECYCLE
    // ----------------------------

    const swappable = isSwappable(bucket);
    const soldOut = isSoldOut(bucket);
    const firstBuyPending = isFirstBuyPending(bucket);
    const fillPercent = getFillPercentage(bucket);
    const graduated = await isGraduated(umi, bucket);

    // ----------------------------
    // PRICE ENGINE
    // ----------------------------

    let priceTokensPerSol = "0";
    let priceLamportsPerToken = "0";
    let baseReserves = "0";
    let quoteReserves = "0";

    try {
      priceTokensPerSol =
        getCurrentPrice(bucket).toString();

      priceLamportsPerToken =
        getCurrentPriceQuotePerBase(bucket).toString();

      const reserves =
        getCurrentPriceComponents(bucket);

      baseReserves = reserves.baseReserves.toString();
      quoteReserves = reserves.quoteReserves.toString();
    } catch {
      // silent fallback → UI crash yok
    }

    // ----------------------------
    // EXAMPLE SWAP (OPTIONAL)
    // ----------------------------

    let buyQuote1Sol: any = null;

    try {
      if (swappable) {
        buyQuote1Sol = getSwapResult(
          bucket,
          BigInt(1_000_000_000),
          SwapDirection.Buy
        );
      }
    } catch {
      buyQuote1Sol = null;
    }

    // ----------------------------
    // RESPONSE (PUMPFUN STYLE)
    // ----------------------------

    return NextResponse.json({
      success: true,

      genesisAccount: genesisAccountStr,
      bucketPda: bucketPda.toString(),

      state: "ACTIVE",

      lifecycle: {
        isSwappable: swappable,
        isSoldOut: soldOut,
        isGraduated: graduated,
        isFirstBuyPending: firstBuyPending,
        fillPercent,
      },

      reserves: {
        baseReserves,
        quoteReserves,
      },

      price: {
        tokensPerSol: priceTokensPerSol,
        lamportsPerToken: priceLamportsPerToken,
      },

      example: buyQuote1Sol
        ? {
            buy1Sol: {
              amountIn: buyQuote1Sol.amountIn.toString(),
              amountOut: buyQuote1Sol.amountOut.toString(),
              fee: buyQuote1Sol.fee.toString(),
            },
          }
        : null,
    });
  } catch (err: any) {
    console.error("INFO_FATAL:", err);

    return NextResponse.json(
      {
        success: false,
        state: "FATAL_ERROR",
        error: "Internal error",
      },
      { status: 500 }
    );
  }
}