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

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

function toBigIntSafe(value: unknown): bigint {
  try {
    if (typeof value === "bigint") {
      return value;
    }

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
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function minOutWithSlippage(amountOut: bigint): bigint {
  return (amountOut * BigInt(99)) / BigInt(100);
}

// ----------------------------------------------------
// ROUTE
// ----------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("SWAP_REQUEST_BODY:", body);

    const {
      mintAddress,
      amount,
      userPublicKey,
      isBuy,
    } = body;

    // ------------------------------------------------
    // VALIDATION
    // ------------------------------------------------

    if (!mintAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_MINT",
        },
        {
          status: 400,
        }
      );
    }

    if (!userPublicKey) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_USER",
        },
        {
          status: 400,
        }
      );
    }

    if (amount == null) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_AMOUNT",
        },
        {
          status: 400,
        }
      );
    }

    let amountBigInt: bigint;

    try {
      amountBigInt = toBigIntSafe(amount);
    } catch (error) {
      console.error(
        "AMOUNT_PARSE_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "INVALID_AMOUNT",
        },
        {
          status: 400,
        }
      );
    }

    if (amountBigInt <= BigInt(0)) {
      return NextResponse.json(
        {
          success: false,
          error: "AMOUNT_TOO_SMALL",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------
    // UMI
    // ------------------------------------------------

    let umi;

    try {
      umi = getPlatformUmi();
    } catch (error) {
      console.error(
        "UMI_INIT_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "UMI_INIT_FAILED",
          details: safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    // ------------------------------------------------
    // PUBLIC KEYS
    // ------------------------------------------------

    let genesisAccount;
    let user;
    let wsol;

    try {
      genesisAccount = publicKey(mintAddress);
      user = publicKey(userPublicKey);
      wsol = publicKey(WSOL_MINT);
    } catch (error) {
      console.error(
        "PUBLIC_KEY_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PUBLIC_KEY",
          details: safeError(error),
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------
    // BUCKET PDA
    // ------------------------------------------------

    let bucketPda;

    try {
      [bucketPda] = findBondingCurveBucketV2Pda(
        umi,
        {
          genesisAccount,
          bucketIndex: 0,
        }
      );
    } catch (error) {
      console.error(
        "BUCKET_PDA_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "BUCKET_PDA_FAILED",
          details: safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    // ------------------------------------------------
    // FETCH BUCKET
    // ------------------------------------------------

    let bucket;

    try {
      bucket = await fetchBondingCurveBucketV2(
        umi,
        bucketPda
      );

      console.log("BUCKET_FETCH_OK");
    } catch (error) {
      console.error(
        "BUCKET_FETCH_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "BUCKET_FETCH_FAILED",
          details: safeError(error),
        },
        {
          status: 502,
        }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        {
          success: false,
          error: "BUCKET_NOT_FOUND",
        },
        {
          status: 404,
        }
      );
    }

    console.log("STEP_BUCKET_OK");

    if (!isSwappable(bucket)) {
      console.error("TOKEN_NOT_SWAPPABLE");

      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_NOT_SWAPPABLE",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------------------
    // DIRECTION
    // ------------------------------------------------

    const direction = isBuy
      ? SwapDirection.Buy
      : SwapDirection.Sell;

    // ------------------------------------------------
    // QUOTE
    // ------------------------------------------------

    let quote;

    try {
      console.log("STEP_QUOTE_START");

      quote = getSwapResult(
        bucket,
        amountBigInt,
        direction
      );

      console.log("STEP_QUOTE_OK");
    } catch (error) {
      console.error(
        "QUOTE_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "QUOTE_FAILED",
          details: safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    // ------------------------------------------------
    // TOKEN ACCOUNTS
    // ------------------------------------------------

    let baseATA;
    let quoteATA;

    try {
      [baseATA] = findAssociatedTokenPda(umi, {
        mint: genesisAccount,
        owner: user,
      });

      [quoteATA] = findAssociatedTokenPda(umi, {
        mint: wsol,
        owner: user,
      });

      console.log("ATA_OK");
    } catch (error) {
      console.error(
        "ATA_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "ATA_FAILED",
          details: safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    // ------------------------------------------------
    // BUILD SWAP
    // ------------------------------------------------

    const minOut = minOutWithSlippage(
      quote.amountOut
    );

    let builder;

    try {
      console.log("STEP_BUILDER_START");

      builder = swapBondingCurveV2(umi, {
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

      console.log("STEP_BUILDER_OK");
    } catch (error) {
      console.error(
        "BUILDER_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "BUILDER_FAILED",
          details: safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    // ------------------------------------------------
    // BUILD TX
    // ------------------------------------------------

    let tx;

    try {
      console.log("STEP_TX_BUILD_START");

      tx = await builder.build(umi);

      console.log("STEP_TX_BUILD_OK");
    } catch (error) {
      console.error(
        "TX_BUILD_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "TX_BUILD_FAILED",
          details: safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    // ------------------------------------------------
    // SERIALIZE
    // ------------------------------------------------

    let serialized: string;

    try {
      console.log("STEP_SERIALIZE_START");

      serialized = Buffer.from(
        umi.transactions.serialize(tx)
      ).toString("base64");

      console.log("STEP_SERIALIZE_OK");
    } catch (error) {
      console.error(
        "SERIALIZE_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error: "SERIALIZE_FAILED",
          details: safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    console.log("STEP_SUCCESS");

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
  } catch (error) {
    console.error(
      "SWAP_FATAL_ERROR:",
      safeError(error)
    );

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        details: safeError(error),
      },
      {
        status: 500,
      }
    );
  }
}