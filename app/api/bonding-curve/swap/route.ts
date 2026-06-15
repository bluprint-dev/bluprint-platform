import { NextRequest, NextResponse } from "next/server";
import { publicKey, transactionBuilder, createNoopSigner, signerIdentity } from "@metaplex-foundation/umi";
import { findAssociatedTokenPda, createAssociatedToken, syncNative, transferSol } from "@metaplex-foundation/mpl-toolbox";
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
const RATE_LIMIT_MS = 3000;

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
  return (amountOut * BigInt(95)) / BigInt(100);
}

function extractBaseMint(bucket: unknown): string | null {
  try {
    const b = (bucket as any).bucket;
    const baseMint = b?.baseMint;
    if (!baseMint) return null;
    if (baseMint.__option === "Some" && baseMint.value) return baseMint.value;
    if (typeof baseMint === "string") return baseMint;
    return null;
  } catch {
    return null;
  }
}

function extractCreatorFeeWallet(bucket: unknown): string | null {
  try {
    const b = bucket as any;
    const creatorFee = b?.extensions?.creatorFee;
    if (creatorFee?.__option === "Some" && creatorFee?.value?.wallet) {
      const wallet = creatorFee.value.wallet;
      if (typeof wallet === "string") return wallet;
      if (wallet?.toString) return wallet.toString();
    }
    const wallet =
      b?.creatorFeeWallet ??
      b?.feeWallet ??
      b?.bucket?.creatorFeeWallet ??
      b?.bucket?.feeWallet ??
      null;
    if (!wallet) return null;
    if (wallet.__option === "Some" && wallet.value) return wallet.value.toString();
    if (typeof wallet === "string") return wallet;
    if (wallet?.toString) return wallet.toString();
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      genesisAccount: genesisAccountRaw,
      mintAddress,
      amount,
      userPublicKey,
      isBuy,
    } = body;

    if (!genesisAccountRaw || !userPublicKey || !amount) {
      return NextResponse.json(
        { success: false, error: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    // -- Rate limiting (Supabase) --
    const { supabase } = await import("@/lib/supabase");
    const { data: lastTrade } = await supabase
      .from("trades")
      .select("created_at")
      .eq("wallet", userPublicKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastTrade?.created_at) {
      const diff = Date.now() - new Date(lastTrade.created_at).getTime();
      if (diff < RATE_LIMIT_MS) {
        return NextResponse.json(
          { success: false, error: "RATE_LIMITED", retryAfter: RATE_LIMIT_MS - diff },
          { status: 429 }
        );
      }
    }

    const amountBigInt = toBigIntSafe(amount);
    const genesisAccount = publicKey(genesisAccountRaw);
    const user = publicKey(userPublicKey);
    const wsol = publicKey(WSOL_MINT);

    const umi = getPlatformUmi().use(signerIdentity(createNoopSigner(user)));

    // -- BUCKET --
    const [bucketPda] = findBondingCurveBucketV2Pda(umi, { genesisAccount, bucketIndex: 0 });

    let bucket;
    try {
      bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    } catch (e) {
      return NextResponse.json({ success: false, error: "BUCKET_FETCH_FAILED" }, { status: 400 });
    }

    if (!bucket || !isSwappable(bucket)) {
      return NextResponse.json({ success: false, error: "NOT_SWAPPABLE" }, { status: 400 });
    }

    const feeWalletStr = extractCreatorFeeWallet(bucket);
    const direction = isBuy ? SwapDirection.Buy : SwapDirection.Sell;
    const quote = getSwapResult(bucket, amountBigInt, direction);
    const minOut = minOutWithSlippage(quote.amountOut);

    const baseMintStr = extractBaseMint(bucket) ?? mintAddress ?? null;
    if (!baseMintStr) {
      return NextResponse.json({ success: false, error: "MISSING_BASE_MINT" }, { status: 400 });
    }
    const baseMint = publicKey(baseMintStr);

    const [baseATA] = findAssociatedTokenPda(umi, { mint: baseMint, owner: user });
    const [quoteATA] = findAssociatedTokenPda(umi, { mint: wsol, owner: user });

    // -- WRAP SOL (sadece buy'da) --
    let wrapBuilder = transactionBuilder();
    if (isBuy) {
      const quoteAtaAccount = await umi.rpc.getAccount(quoteATA);
      if (!quoteAtaAccount.exists) {
        wrapBuilder = wrapBuilder
          .add(createAssociatedToken(umi, { mint: wsol, owner: user, payer: user }))
          .add(transferSol(umi, { source: umi.identity, destination: quoteATA, amount: { basisPoints: amountBigInt, identifier: "SOL", decimals: 9 } }))
          .add(syncNative(umi, { account: quoteATA }));
      } else {
        wrapBuilder = wrapBuilder
          .add(transferSol(umi, { source: umi.identity, destination: quoteATA, amount: { basisPoints: amountBigInt, identifier: "SOL", decimals: 9 } }))
          .add(syncNative(umi, { account: quoteATA }));
      }
    }

    // -- FEE ATA --
    let feeAtaTxBase64: string | null = null;
    if (feeWalletStr) {
      const feeWallet = publicKey(feeWalletStr);
      const [feeAta] = findAssociatedTokenPda(umi, { mint: wsol, owner: feeWallet });
      const feeAtaAccount = await umi.rpc.getAccount(feeAta);
      if (!feeAtaAccount.exists) {
        const feeAtaBuilderTx = createAssociatedToken(umi, { mint: wsol, owner: feeWallet, payer: user });
        const feeAtaBuilt = await feeAtaBuilderTx.buildWithLatestBlockhash(umi);
        feeAtaTxBase64 = Buffer.from(umi.transactions.serialize(feeAtaBuilt)).toString("base64");
      }
    }

    // -- BUILD SWAP --
    const swapIx = swapBondingCurveV2(umi, {
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

    const combinedBuilder = wrapBuilder.add(swapIx);
    const tx = await (await combinedBuilder.setLatestBlockhash(umi)).buildAndSign(umi);
    const serialized = Buffer.from(umi.transactions.serialize(tx)).toString("base64");

    return NextResponse.json({
      success: true,
      transaction: serialized,
      ...(feeAtaTxBase64 ? { feeAtaTx: feeAtaTxBase64 } : {}),
      quote: {
        amountIn: quote.amountIn.toString(),
        amountOut: quote.amountOut.toString(),
        fee: quote.fee.toString(),
        creatorFee: quote.creatorFee?.toString() ?? "0",
      },
      meta: {
        genesisAccount: genesisAccountRaw,
        mintAddress: baseMintStr,
        userPublicKey,
        direction: isBuy ? "buy" : "sell",
        feeWallet: feeWalletStr ?? null,
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