import { NextRequest, NextResponse } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  genesis,
  createLaunch,
  registerLaunch,
  isGenesisApiError,
  isGenesisApiNetworkError,
  isGenesisValidationError,
} from "@metaplex-foundation/genesis";
import { redis } from "@/app/lib/redis";

export const runtime = "nodejs";

function getUmi(userWallet: string) {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) throw new Error("NEXT_PUBLIC_RPC_URL missing");

  const umi = createUmi(rpcUrl).use(genesis());
  return umi;
}

function safeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

// ─── POST /api/bonding-curve/launch ───────────────────────────────────────────
// Body: { name, symbol, image, description?, website?, twitter?, telegram?, userWallet }
// Returns: { transactions: string[], blockhash, mintAddress, genesisAccount }
//
// Kullanıcı bu transaction'ları alır, cüzdanıyla imzalar ve gönderir.
// İmzaladıktan sonra /api/bonding-curve/register endpoint'ini çağırır.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("LAUNCH_REQUEST:", body);

    const { name, symbol, image, description, twitter, telegram, website, userWallet } = body;

    if (!name || !symbol || !image) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, symbol, image" },
        { status: 400 }
      );
    }

    if (!userWallet) {
      return NextResponse.json(
        { success: false, error: "Missing userWallet" },
        { status: 400 }
      );
    }

    const umi = getUmi(userWallet);

    const input = {
      wallet: userWallet,           // Kullanıcı cüzdanı — tüm fee'leri o öder
      token: {
        name,
        symbol,
        image,
        description: description || "",
        externalLinks: {
          website: website || undefined,
          twitter: twitter || undefined,
          telegram: telegram || undefined,
        },
      },
      launchType: "bondingCurve" as const,
      launch: {
        creatorFeeWallet: userWallet, // Creator fee'leri de kullanıcıya gitsin
        firstBuyAmount: 0,
      },
    };

    console.log("CREATE_INPUT:", input);

    // createLaunch: sadece transaction'ları HAZIRLAR, imzalamaz
    const result = await createLaunch(umi, {}, input);

    console.log("CREATE_RESULT:", {
      mintAddress: result.mintAddress,
      genesisAccount: result.genesisAccount,
      txCount: result.transactions.length,
    });

    // Transaction'ları base64'e serialize et, frontend imzalayacak
    const serializedTxs = result.transactions.map((tx) =>
      Buffer.from(umi.transactions.serialize(tx)).toString("base64")
    );

    return NextResponse.json({
      success: true,
      transactions: serializedTxs,
      blockhash: result.blockhash,
      mintAddress: result.mintAddress,
      genesisAccount: result.genesisAccount,
    });

  } catch (err) {
    console.error("LAUNCH_FATAL:", safeError(err));

    if (isGenesisValidationError(err)) {
      return NextResponse.json(
        { success: false, type: "VALIDATION_ERROR", field: err.field, error: err.message },
        { status: 400 }
      );
    }
    if (isGenesisApiError(err)) {
      return NextResponse.json(
        { success: false, type: "GENESIS_API_ERROR", statusCode: err.statusCode, details: err.responseBody },
        { status: 502 }
      );
    }
    if (isGenesisApiNetworkError(err)) {
      return NextResponse.json(
        { success: false, type: "NETWORK_ERROR", error: err.cause.message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, type: "UNKNOWN_ERROR", error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}