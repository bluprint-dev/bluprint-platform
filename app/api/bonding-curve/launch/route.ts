import { NextRequest, NextResponse } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  genesis,
  createAndRegisterLaunch,
  isGenesisApiError,
  isGenesisApiNetworkError,
  isGenesisValidationError,
} from "@metaplex-foundation/genesis";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { redis } from "@/app/lib/redis";

export const runtime = "nodejs";

function getPlatformUmi() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) throw new Error("NEXT_PUBLIC_RPC_URL missing");

  const secretKeyRaw = process.env.PLATFORM_SECRET_KEY;
  if (!secretKeyRaw) throw new Error("PLATFORM_SECRET_KEY missing");

  const umi = createUmi(rpcUrl).use(genesis());

  // Auto-detect: base58 string vs JSON array
  let secretKeyBytes: Uint8Array;
  const trimmed = secretKeyRaw.trim();

  if (trimmed.startsWith("[")) {
    // JSON array format: [1,2,3,...]
    secretKeyBytes = Uint8Array.from(JSON.parse(trimmed));
  } else {
    // Base58 format: 5dQ74xLg4og...
    secretKeyBytes = bs58.decode(trimmed);
  }

  const web3Keypair = Keypair.fromSecretKey(secretKeyBytes);
  const keypair = fromWeb3JsKeypair(web3Keypair);
  umi.use(keypairIdentity(keypair));

  return umi;
}

function safeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("LAUNCH_REQUEST:", body);

    const { name, symbol, image, description, twitter, telegram, website } = body;

    if (!name || !symbol || !image) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const umi = getPlatformUmi();

    const input = {
      wallet: umi.identity.publicKey,
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
        creatorFeeWallet: umi.identity.publicKey,
        firstBuyAmount: 0,
      },
    };

    console.log("CREATE_INPUT:", input);
    const result = await createAndRegisterLaunch(umi, {}, input);
    console.log("CREATE_RESULT:", result);

    await redis.sadd("bonding-curve:tokens", result.genesisAccount);
    await redis.sadd("bonding-curve:tokens:legacy", result.genesisAccount);
    await redis.set(`genesis:mint:${result.genesisAccount}`, result.mintAddress);

    console.log("LAUNCH_ADDRESSES", {
      mintAddress: result.mintAddress,
      genesisAccount: result.genesisAccount,
    });

    await redis.set(
      `token:metadata:${result.mintAddress}`,
      JSON.stringify({
        mint: result.mintAddress,
        genesisAccount: result.genesisAccount,
        name,
        symbol,
        imageUrl: image,
        description: description || "",
        creator: umi.identity.publicKey.toString(),
        website: website || "",
        twitter: twitter || "",
        telegram: telegram || "",
        createdAt: Date.now(),
      })
    );

    await redis.set(`genesis:metadata:${result.genesisAccount}`, result.mintAddress);

    console.log("REDIS_SAVED:", {
      metadataKey: `token:metadata:${result.mintAddress}`,
      genesisKey: `genesis:mint:${result.genesisAccount}`,
    });

    return NextResponse.json({
      success: true,
      mintAddress: result.mintAddress,
      genesisAccount: result.genesisAccount,
      launchId: result.launch.id,
      launchLink: result.launch.link,
      token: {
        mint: result.mintAddress,
        genesisAccount: result.genesisAccount,
      },
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