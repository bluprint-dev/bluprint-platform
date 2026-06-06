import { NextRequest, NextResponse } from "next/server";
import { publicKey } from "@metaplex-foundation/umi";
import { findAssociatedTokenPda } from "@metaplex-foundation/mpl-toolbox";
import { getPlatformUmi } from "@/app/lib/umi";
import { redis } from "@/app/lib/redis";

import {
  findBondingCurveBucketV2Pda,
  fetchBondingCurveBucketV2,
  claimBondingCurveCreatorFeeV2,
  findBondingCurveCreatorFeeUnwrapPda,
} from "@metaplex-foundation/genesis";

const WSOL_MINT = "So11111111111111111111111111111111111111112";

function safeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: String(error) };
}

// ─────────────────────────────────────────────────────────────
// GET /api/bonding-curve/claim?genesisAccount=xxx&wallet=xxx
// Bekleyen fee miktarını gösterir (claim etmez)
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genesisAccountStr = searchParams.get("genesisAccount");
    const walletStr = searchParams.get("wallet");

    if (!genesisAccountStr) {
      return NextResponse.json({ success: false, error: "Missing genesisAccount" }, { status: 400 });
    }

    const umi = getPlatformUmi();
    const genesisAccount = publicKey(genesisAccountStr);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount,
      bucketIndex: 0,
    });

    let bucket;
    try {
      bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    } catch {
      return NextResponse.json({ success: false, error: "Bucket not found" }, { status: 404 });
    }

    // creatorFeeAccrued ve creatorFeeClaimed bucket'ta on-chain tutuluyor
    const accrued = bucket.creatorFeeAccrued ?? BigInt(0);
    const claimed = bucket.creatorFeeClaimed ?? BigInt(0);
    const pending = accrued > claimed ? accrued - claimed : BigInt(0);

    return NextResponse.json({
      success: true,
      genesisAccount: genesisAccountStr,
      bucketPda: bucketPda.toString(),
      fees: {
        accrued: accrued.toString(),
        claimed: claimed.toString(),
        pending: pending.toString(),
        pendingSol: (Number(pending) / 1e9).toFixed(6),
      },
    });
  } catch (err) {
    console.error("CLAIM_GET_FATAL:", safeError(err));
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/bonding-curve/claim
// Body: { genesisAccount, creatorWallet, mintAddress }
// Creator fee'yi creatorWallet'a çeker
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { genesisAccount: genesisAccountRaw, creatorWallet, mintAddress } = body;

    if (!genesisAccountRaw || !creatorWallet) {
      return NextResponse.json(
        { success: false, error: "Missing genesisAccount or creatorWallet" },
        { status: 400 }
      );
    }

    // ✅ Creator veya platform wallet claim edebilir
    // creatorFee.wallet = BONDING_CURVE_FEE_WALLET (launch sırasında set edildi)
    // sadece bu adres claimBondingCurveCreatorFeeV2'yi çağırabilir
    const storedCreator = await redis.get(`bonding-curve:creator:${genesisAccountRaw}`);
    const platformWallet = process.env.BONDING_CURVE_FEE_WALLET ?? "";

    const isTokenCreator = storedCreator && storedCreator === creatorWallet;
    const isPlatformWallet = platformWallet && platformWallet === creatorWallet;

    if (!isTokenCreator && !isPlatformWallet) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED — wallet is not the creator of this token" },
        { status: 403 }
      );
    }

    const umi = getPlatformUmi();
    const genesisAccount = publicKey(genesisAccountRaw);
    const creatorFeeWallet = publicKey(creatorWallet);
    const wsol = publicKey(WSOL_MINT);

    const [bucketPda] = findBondingCurveBucketV2Pda(umi, {
      genesisAccount,
      bucketIndex: 0,
    });

    let bucket;
    try {
      bucket = await fetchBondingCurveBucketV2(umi, bucketPda);
    } catch {
      return NextResponse.json({ success: false, error: "Bucket not found" }, { status: 404 });
    }

    // Pending fee kontrol
    const accrued = bucket.creatorFeeAccrued ?? BigInt(0);
    const claimed = bucket.creatorFeeClaimed ?? BigInt(0);
    const pending = accrued > claimed ? accrued - claimed : BigInt(0);

    if (pending === BigInt(0)) {
      return NextResponse.json({ success: false, error: "NO_FEES_TO_CLAIM" }, { status: 400 });
    }

    // baseMint bul
    const baseMintStr = mintAddress
      ?? (await redis.get(`genesis:mint:${genesisAccountRaw}`))
      ?? null;

    if (!baseMintStr) {
      return NextResponse.json(
        { success: false, error: "MISSING_BASE_MINT — provide mintAddress" },
        { status: 400 }
      );
    }

    const baseMint = publicKey(baseMintStr as string);

    // creator'ın WSOL ATA'sı (fee buraya gider, native SOL olarak unwrap edilir)
    const [creatorWsolATA] = findAssociatedTokenPda(umi, {
      mint: wsol,
      owner: creatorFeeWallet,
    });

    // Transient unwrap PDA (WSOL → native SOL için SDK kullanır)
    const [bucketCreatorFeeUnwrapAccount] = findBondingCurveCreatorFeeUnwrapPda(umi, {
      bucket: bucketPda,
    });

    // ✅ Claim instruction
    const builder = claimBondingCurveCreatorFeeV2(umi, {
      genesisAccount,
      bucket: bucketPda,
      baseMint,
      quoteMint: wsol,
      bucketQuoteTokenAccount: undefined, // SDK türetir
      creatorFeeWallet,
      creatorFeeWalletQuoteTokenAccount: creatorWsolATA,
      bucketCreatorFeeUnwrapAccount,
    });

    const tx = await (await builder.setLatestBlockhash(umi)).buildAndSign(umi);

    const serialized = Buffer.from(
      umi.transactions.serialize(tx)
    ).toString("base64");

    console.log("CLAIM_TX_BUILT:", {
      genesisAccount: genesisAccountRaw,
      creatorWallet,
      pendingSol: (Number(pending) / 1e9).toFixed(6),
    });

    return NextResponse.json({
      success: true,
      transaction: serialized,
      claim: {
        pending: pending.toString(),
        pendingSol: (Number(pending) / 1e9).toFixed(6),
        creatorWallet,
        genesisAccount: genesisAccountRaw,
      },
    });
  } catch (err) {
    console.error("CLAIM_POST_FATAL:", safeError(err));
    return NextResponse.json(
      { success: false, error: "CLAIM_FAILED", details: safeError(err) },
      { status: 500 }
    );
  }
}