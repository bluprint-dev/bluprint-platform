import { NextRequest, NextResponse } from "next/server";
import { publicKey } from "@metaplex-foundation/umi";
import { findAssociatedTokenPda } from "@metaplex-foundation/mpl-toolbox";
import { getPlatformUmi } from "@/app/lib/umi";

import {
  findBondingCurveBucketV2Pda,
  fetchBondingCurveBucketV2,
  getSwapResult,
  swapBondingCurveV2,
  SwapDirection,
  isSwappable,
} from "@metaplex-foundation/genesis";

const WSOL_MINT = "So11111111111111111111111111111111111111112";

// ------------------------------
// HELPERS
// ------------------------------
function toBigIntSafe(value: unknown): bigint {
  try {
    if (typeof value === "bigint") return value;
    return BigInt(value as string | number);
  } catch {
    throw new Error("INVALID_BIGINT");
  }
}

function safeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: String(error) };
}

function minOutWithSlippage(amountOut: bigint) {
  return (amountOut * BigInt(99)) / BigInt(100);
}

/**
 * Genesis SDK bucket'ında baseMint, nested __option yapısında gelir:
 *   bucket.bucket.baseMint = { __option: "Some", value: "..." }
 * Bu helper her iki durumu da handle eder (Some / None / undefined).
 */
function extractBaseMint(bucket: unknown): string | null {
  try {
    const b = (bucket as any).bucket;
    const baseMint = b?.baseMint;
    if (!baseMint) return null;

    // __option: "Some" yapısı
    if (baseMint.__option === "Some" && baseMint.value) {
      return baseMint.value;
    }

    // Düz string ise direkt dön (SDK güncellenirse)
    if (typeof baseMint === "string") {
      return baseMint;
    }

    return null;
  } catch {
    return null;
  }
}

// ------------------------------
// ROUTE
// ------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("SWAP_REQUEST_BODY:", body);

    const {
      genesisAccount: genesisAccountRaw,
      mintAddress, // SPL token mint — baseMint bulunamazsa fallback
      amount,
      userPublicKey,
      isBuy,
    } = body;

    if (!genesisAccountRaw || !userPublicKey || !amount) {
      return NextResponse.json(
        {
          success: false,
          error:
            "MISSING_PARAMS — genesisAccount, userPublicKey, amount required",
        },
        { status: 400 }
      );
    }

    const amountBigInt = toBigIntSafe(amount);
    const umi = getPlatformUmi();

    const genesisAccount = publicKey(genesisAccountRaw);
    const user = publicKey(userPublicKey);
    const wsol = publicKey(WSOL_MINT);

    // ------------------------------
    // BUCKET — genesisAccount ile PDA türet
    // ------------------------------
    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount, // ✅
      bucketIndex: 0,
    });

    let bucket;
    try {
      bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: "BUCKET_FETCH_FAILED — genesisAccount may be invalid",
        },
        { status: 400 }
      );
    }

    if (!bucket || !isSwappable(bucket)) {
      return NextResponse.json(
        { success: false, error: "NOT_SWAPPABLE" },
        { status: 400 }
      );
    }

    const direction = isBuy ? SwapDirection.Buy : SwapDirection.Sell;

    // ------------------------------
    // QUOTE
    // ------------------------------
    const quote = getSwapResult(bucket, amountBigInt, direction);
    const minOut = minOutWithSlippage(quote.amountOut);

    // ------------------------------
    // baseMint: bucket.bucket.baseMint.value içinde (nested __option yapısı)
    // ✅ FIX: (bucket as any).baseMint değil, extractBaseMint() kullan
    // ------------------------------
    const baseMintStr = extractBaseMint(bucket) ?? mintAddress ?? null;

    if (!baseMintStr) {
      return NextResponse.json(
        {
          success: false,
          error:
            "MISSING_BASE_MINT — bucket returned no baseMint, provide mintAddress in request body",
        },
        { status: 400 }
      );
    }

    const baseMint = publicKey(baseMintStr);

    // ------------------------------
    // ATAs — gerçek SPL mint ile
    // ------------------------------
    const [baseATA] = findAssociatedTokenPda(umi, {
      mint: baseMint, // ✅ bucket'tan gelen baseMint — genesisAccount değil
      owner: user,
    });

    const [quoteATA] = findAssociatedTokenPda(umi, {
      mint: wsol,
      owner: user,
    });

    // ------------------------------
    // BUILD SWAP
    // ------------------------------
    const builder = swapBondingCurveV2(umi, {
      genesisAccount, // ✅ curve için genesisAccount
      bucket: bucketPda,

      baseMint, // ✅ ATA ve token transfer için gerçek SPL mint
      quoteMint: wsol,

      baseTokenAccount: baseATA,
      quoteTokenAccount: quoteATA,

      baseTokenOwner: user,
      quoteTokenOwner: user,

      swapDirection: direction,
      amount: amountBigInt,
      minAmountOutScaled: minOut,
    });

    const tx = await builder.build(umi);

    const serialized = Buffer.from(
      umi.transactions.serialize(tx)
    ).toString("base64");

    return NextResponse.json({
      success: true,
      transaction: serialized,
      quote: {
        amountIn: quote.amountIn.toString(),
        amountOut: quote.amountOut.toString(),
        fee: quote.fee.toString(),
      },
      meta: {
        genesisAccount: genesisAccountRaw,
        mintAddress: baseMintStr,
        userPublicKey,
        direction: isBuy ? "buy" : "sell",
      },
    });
  } catch (error) {
    console.error("SWAP_FATAL:", safeError(error));

    return NextResponse.json(
      {
        success: false,
        error: "SWAP_FAILED",
        details: safeError(error),
      },
      { status: 500 }
    );
  }
}