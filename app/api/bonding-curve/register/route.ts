import { NextRequest, NextResponse } from "next/server";
import {
  genesis,
  registerLaunch,
  isGenesisApiError,
  isGenesisApiNetworkError,
  isGenesisValidationError,
} from "@metaplex-foundation/genesis";
import { getPlatformUmi } from "@/app/lib/umi";
import { redis } from "@/app/lib/redis";

export const runtime = "nodejs";

function safeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: String(error) };
}

// POST /api/bonding-curve/register
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("REGISTER_REQUEST:", {
      mintAddress: body.mintAddress,
      genesisAccount: body.genesisAccount,
      userWallet: body.userWallet,
    });

    const {
      genesisAccount,
      mintAddress,
      createLaunchInput,
      name,
      symbol,
      imageUrl,
      description,
      website,
      twitter,
      telegram,
      userWallet,
    } = body;

    if (!genesisAccount || !createLaunchInput) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: genesisAccount, createLaunchInput" },
        { status: 400 }
      );
    }

    // getPlatformUmi → platform cüzdanı signer olarak set edilmiş
    const umi = getPlatformUmi();
    await registerLaunch(umi, {}, {
      genesisAccount,
      createLaunchInput,
    });

    console.log("REGISTER_SUCCESS:", { mintAddress, genesisAccount });

    // Redis'e kaydet (hata olursa devam et)
    try {
      if (redis && mintAddress) {
        await redis.hset(`token:${mintAddress}`, {
          mintAddress,
          genesisAccount,
          name: name || "",
          symbol: symbol || "",
          imageUrl: imageUrl || "",
          description: description || "",
          website: website || "",
          twitter: twitter || "",
          telegram: telegram || "",
          userWallet: userWallet || "",
          createdAt: Date.now().toString(),
        });
        await redis.lpush("recent_tokens", mintAddress);
        await redis.ltrim("recent_tokens", 0, 99);
        await redis.set(`bonding-curve:creator:${genesisAccount}`, userWallet || "");
        await redis.set(`genesis:mint:${genesisAccount}`, mintAddress || "");
      }
    } catch (redisErr) {
      console.warn("Redis save failed (non-fatal):", redisErr);
    }

    return NextResponse.json({
      success: true,
      mintAddress,
      genesisAccount,
    });

  } catch (err) {
    console.error("REGISTER_FATAL:", safeError(err));

    if (isGenesisValidationError(err)) {
      return NextResponse.json(
        { success: false, type: "VALIDATION_ERROR", field: (err as any).field, error: (err as any).message },
        { status: 400 }
      );
    }
    if (isGenesisApiError(err)) {
      return NextResponse.json(
        { success: false, type: "GENESIS_API_ERROR", statusCode: (err as any).statusCode, details: (err as any).responseBody },
        { status: 502 }
      );
    }
    if (isGenesisApiNetworkError(err)) {
      return NextResponse.json(
        { success: false, type: "NETWORK_ERROR", error: (err as any).cause?.message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, type: "UNKNOWN_ERROR", error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}