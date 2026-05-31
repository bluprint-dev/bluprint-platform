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

function extractBaseMint(bucket: unknown): string | null {
  try {
    const b = (bucket as any).bucket;
    const baseMint = b?.baseMint;
    if (!baseMint) return null;

    if (baseMint.__option === "Some" && baseMint.value) {
      return baseMint.value;
    }

    if (typeof baseMint === "string") {
      return baseMint;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("SWAP_REQUEST_BODY:", body);

    const {
      genesisAccount: genesisAccountRaw,
      mintAddress,
      amount,
      userPublicKey,
      isBuy,
    } = body;

    if (!genesisAccountRaw || !userPublicKey || !amount) {
      return NextResponse.json(
        { success: false, error: "MISSING_PARAMS — genesisAccount, userPublicKey, amount required" },
        { status: 400 }
      );
    }

    const amountBigInt = toBigIntSafe(amount);
    const umi = getPlatformUmi();

    const genesisAccount = publicKey(genesisAccountRaw);
    const user = publicKey(userPublicKey);
    const wsol = publicKey(WSOL_MINT);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount,
      bucketIndex: 0,
    });

    let bucket;
    try {
      bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "BUCKET_FETCH_FAILED — genesisAccount may be invalid" },
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

    const quote = getSwapResult(bucket, amountBigInt, direction);
    const minOut = minOutWithSlippage(quote.amountOut);

    const baseMintStr = extractBaseMint(bucket) ?? mintAddress ?? null;

    if (!baseMintStr) {
      return NextResponse.json(
        { success: false, error: "MISSING_BASE_MINT — bucket returned no baseMint, provide mintAddress in request body" },
        { status: 400 }
      );
    }

    const baseMint = publicKey(baseMintStr);

    const [baseATA] = findAssociatedTokenPda(umi, {
      mint: baseMint,
      owner: user,
    });

    const [quoteATA] = findAssociatedTokenPda(umi, {
      mint: wsol,
      owner: user,
    });

    const builder = swapBondingCurveV2(umi, {
      genesisAccount,
      bucket: bucketPda,
      baseMint,
      quoteMint: wsol,
      baseTokenAccount: baseATA,
      quoteTokenAccount: quoteATA,
      baseTokenOwner: user,
      quoteTokenOwner: user,
      swapDirection: direction,
      amount: amountBigInt,
      minAmountOutScaled: minOut,
    });

    // ✅ FIX: blockhash olmadan build() hata veriyor
    const tx = await (await builder.setLatestBlockhash(umi)).buildAndSign(umi);

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
      { success: false, error: "SWAP_FAILED", details: safeError(error) },
      { status: 500 }
    );
  }
}