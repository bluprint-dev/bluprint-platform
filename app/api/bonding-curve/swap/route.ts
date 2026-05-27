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
} from "@metaplex-foundation/genesis";

const WSOL_MINT =
  "So11111111111111111111111111111111111111112";

// ----------------------------
// SAFE BIGINT HELPERS (NO LITERALS)
// ----------------------------

const ONE = BigInt(1);
const HUNDRED = BigInt(100);
const ONE_SOL_LAMPORTS = BigInt(1000000000);

function toBigIntSafe(value: any): bigint {
  try {
    if (typeof value === "bigint") return value;
    return BigInt(value);
  } catch {
    throw new Error("Invalid bigint value");
  }
}

function slippageMinOut(amountOut: bigint): bigint {
  // %1 slippage
  const num = BigInt(99);
  const den = BigInt(100);
  return (amountOut * num) / den;
}

// ----------------------------
// HANDLER
// ----------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      mintAddress,
      amount,
      userPublicKey,
      isBuy,
    } = body;

    // ----------------------------
    // VALIDATION
    // ----------------------------

    if (!mintAddress || !userPublicKey || amount == null) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing fields",
        },
        { status: 400 }
      );
    }

    let amountBigInt: bigint;

    try {
      amountBigInt = toBigIntSafe(amount);
    } catch (e: any) {
      return NextResponse.json(
        {
          success: false,
          error: e.message,
        },
        { status: 400 }
      );
    }

    if (amountBigInt <= BigInt(0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be > 0",
        },
        { status: 400 }
      );
    }

    // ----------------------------
    // UMI INIT
    // ----------------------------

    const umi = getPlatformUmi();

    const genesisAccount = publicKey(mintAddress);
    const user = publicKey(userPublicKey);
    const wsol = publicKey(WSOL_MINT);

    // ----------------------------
    // BONDING CURVE
    // ----------------------------

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
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Bucket fetch failed",
        },
        { status: 502 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        {
          success: false,
          state: "NOT_READY",
          error: "Curve not initialized",
        },
        { status: 409 }
      );
    }

    // ----------------------------
    // DIRECTION
    // ----------------------------

    const direction = isBuy
      ? SwapDirection.Buy
      : SwapDirection.Sell;

    // ----------------------------
    // QUOTE ENGINE
    // ----------------------------

    let quote;

    try {
      quote = getSwapResult(
        bucket,
        amountBigInt,
        direction
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Quote failed",
        },
        { status: 500 }
      );
    }

    // ----------------------------
    // SLIPPAGE
    // ----------------------------

    const minOut = slippageMinOut(quote.amountOut);

    // ----------------------------
    // TOKEN ACCOUNTS
    // ----------------------------

    const [baseATA] = findAssociatedTokenPda(umi, {
      mint: genesisAccount,
      owner: user,
    });

    const [quoteATA] = findAssociatedTokenPda(umi, {
      mint: wsol,
      owner: user,
    });

    // ----------------------------
    // BUILD SWAP
    // ----------------------------

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

    let tx;

    try {
      tx = await builder.build(umi);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Tx build failed",
        },
        { status: 500 }
      );
    }

    const serialized = Buffer.from(
      umi.transactions.serialize(tx)
    ).toString("base64");

    // ----------------------------
    // RESPONSE
    // ----------------------------

    return NextResponse.json({
      success: true,

      transaction: serialized,

      quote: {
        amountIn: quote.amountIn.toString(),
        amountOut: quote.amountOut.toString(),
        fee: quote.fee.toString(),
      },

      meta: {
        mintAddress,
        userPublicKey,
        direction: isBuy ? "buy" : "sell",
      },

      state: "BUILT",
    });
  } catch (err: any) {
    console.error("SWAP_FATAL:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Internal error",
      },
      { status: 500 }
    );
  }
}