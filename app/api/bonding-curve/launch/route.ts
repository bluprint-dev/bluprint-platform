import { NextRequest, NextResponse } from "next/server";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import {
  genesis,
  createAndRegisterLaunch,
  isGenesisApiError,
  isGenesisApiNetworkError,
  isGenesisValidationError,
} from "@metaplex-foundation/genesis";

import {
  keypairIdentity,
} from "@metaplex-foundation/umi";

export const runtime = "nodejs";

function getPlatformUmi() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL;

  if (!rpcUrl) {
    throw new Error(
      "NEXT_PUBLIC_RPC_URL missing"
    );
  }

  const secretKeyRaw =
    process.env.PLATFORM_SECRET_KEY;

  if (!secretKeyRaw) {
    throw new Error(
      "PLATFORM_SECRET_KEY missing"
    );
  }

  const umi = createUmi(rpcUrl).use(
    genesis()
  );

  const secretKey = Uint8Array.from(
    JSON.parse(secretKeyRaw)
  );

  const keypair =
    umi.eddsa.createKeypairFromSecretKey(
      secretKey
    );

  umi.use(
    keypairIdentity(keypair)
  );

  return umi;
}

function safeError(
  error: unknown
) {
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

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    console.log(
      "LAUNCH_REQUEST:",
      body
    );

    const {
      name,
      symbol,
      image,
      description,
      twitter,
      telegram,
      website,
    } = body;

    if (!name || !symbol || !image) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    const umi =
      getPlatformUmi();

    // ✅ GERÇEK SDK PAYLOAD
    const input = {
      wallet:
        umi.identity.publicKey,

      token: {
        name,
        symbol,
        image,

        description:
          description || "",

        externalLinks: {
          website:
            website ||
            undefined,

          twitter:
            twitter ||
            undefined,

          telegram:
            telegram ||
            undefined,
        },
      },

      launchType:
        "bondingCurve" as const,

      launch: {
        creatorFeeWallet:
          umi.identity.publicKey,

        // optional
        firstBuyAmount: 0,
      },
    };

    console.log(
      "CREATE_INPUT:",
      input
    );

    const result =
      await createAndRegisterLaunch(
        umi,
        {},
        input
      );

    console.log(
      "CREATE_RESULT:",
      result
    );

    return NextResponse.json({
      success: true,

      mintAddress:
        result.mintAddress,

      genesisAccount:
        result.genesisAccount,

      launchId:
        result.launch.id,

      launchLink:
        result.launch.link,

      token:
        result.token,
    });
  } catch (err) {
    console.error(
      "LAUNCH_FATAL:",
      safeError(err)
    );

    if (
      isGenesisValidationError(
        err
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          type:
            "VALIDATION_ERROR",

          field:
            err.field,

          error:
            err.message,
        },
        {
          status: 400,
        }
      );
    }

    if (
      isGenesisApiError(err)
    ) {
      return NextResponse.json(
        {
          success: false,
          type:
            "GENESIS_API_ERROR",

          statusCode:
            err.statusCode,

          details:
            err.responseBody,
        },
        {
          status: 502,
        }
      );
    }

    if (
      isGenesisApiNetworkError(
        err
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          type:
            "NETWORK_ERROR",

          error:
            err.cause.message,
        },
        {
          status: 503,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        type:
          "UNKNOWN_ERROR",

        error:
          err instanceof Error
            ? err.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}