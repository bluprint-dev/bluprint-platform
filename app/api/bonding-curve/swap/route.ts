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

const WSOL_MINT =
  "So11111111111111111111111111111111111111112";

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
    return {
      name: error.name,
      message: error.message,
    };
  }
  return { message: String(error) };
}

function minOutWithSlippage(amountOut: bigint) {
  return (amountOut * BigInt(99)) / BigInt(100);
}

// ------------------------------
// ROUTE
// ------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("SWAP_REQUEST_BODY:", body);

    // ✅ FIX: accept BOTH old + new format
    const {
      mintAddress,
      genesisAccount: genesisAccountRaw,
      amount,
      userPublicKey,
      isBuy,
    } = body;

    const genesisInput = genesisAccountRaw || mintAddress;

    if (!genesisInput || !userPublicKey || !amount) {
      return NextResponse.json(
        { success: false, error: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    const amountBigInt = toBigIntSafe(amount);

    const umi = getPlatformUmi();

    const genesisAccount = publicKey(genesisInput);
    const user = publicKey(userPublicKey);
    const wsol = publicKey(WSOL_MINT);

    // ------------------------------
    // BUCKET
    // ------------------------------
    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount,
      bucketIndex: 0,
    });

    const bucket = await fetchBondingCurveBucketV2(umi, bucketPda);

    if (!bucket || !isSwappable(bucket)) {
      return NextResponse.json(
        { success: false, error: "NOT_SWAPPABLE" },
        { status: 400 }
      );
    }

    const direction = isBuy
      ? SwapDirection.Buy
      : SwapDirection.Sell;

    // ------------------------------
    // QUOTE
    // ------------------------------
    const quote = getSwapResult(bucket, amountBigInt, direction);

    const minOut = minOutWithSlippage(quote.amountOut);

    // ------------------------------
    // ATAs
    // ------------------------------
    const [baseATA] = findAssociatedTokenPda(umi, {
      mint: genesisAccount,
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
      genesisAccount,
      bucket: bucketPda,

      baseMint: genesisAccount,
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
        genesisAccount: genesisInput,
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