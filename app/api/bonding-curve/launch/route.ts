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

// --------------------------------------------------
// UMI
// --------------------------------------------------

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

// --------------------------------------------------
// SAFE ERROR
// --------------------------------------------------

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
    message: globalThis.String(
      error
    ),
  };
}

// --------------------------------------------------
// ROUTE
// --------------------------------------------------

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

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "NAME_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SYMBOL_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error:
            "IMAGE_REQUIRED",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // UMI
    // --------------------------------------------------

    let umi;

    try {
      umi =
        getPlatformUmi();

      console.log(
        "UMI_READY"
      );
    } catch (error) {
      console.error(
        "UMI_INIT_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "UMI_INIT_FAILED",

          details:
            safeError(error),
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // INPUT
    // --------------------------------------------------

    // any kullanıyoruz çünkü
    // genesis sdk versiyonları
    // field isimlerini değiştiriyor.

    const input: any = {
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
        "bondingCurve",

      launch: {
        tokenSupply:
          1_000_000_000,

        bondingCurveConfig: {
          virtualSolReserves:
            30,

          virtualTokenReserves:
            1_073_000_000,

          migrationMarketCap:
            69000,

          liquidityBps:
            7000,
        },

        recipient:
          umi.identity.publicKey,
      },
    };

    console.log(
      "CREATE_INPUT:",
      input
    );

    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    let result: any;

    try {
      result =
        await createAndRegisterLaunch(
          umi,
          {},
          input
        );

      console.log(
        "CREATE_RESULT:",
        result
      );

      console.log(
        "CREATE_SUCCESS"
      );
    } catch (error) {
      console.error(
        "CREATE_ERROR:",
        safeError(error)
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "CREATE_FAILED",

          details:
            safeError(error),
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // SIGNATURES
    // --------------------------------------------------

    const signatures =
      Array.isArray(
        result?.signatures
      )
        ? result.signatures.map(
            (
              s: unknown
            ) =>
              Buffer.from(
                s as Uint8Array
              ).toString(
                "base64"
              )
          )
        : [];

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      mintAddress:
        result?.mintAddress,

      genesisAccount:
        result?.genesisAccount,

      launchId:
        result?.launch?.id,

      launchLink:
        result?.launch?.link,

      signatures,

      rawResult:
        result,
    });
  } catch (err) {
    console.error(
      "LAUNCH_FATAL:",
      safeError(err)
    );

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (
      isGenesisValidationError(
        err
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "GENESIS_VALIDATION_ERROR",

          field:
            err.field,

          details:
            err.message,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // API
    // --------------------------------------------------

    if (
      isGenesisApiError(err)
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "GENESIS_API_ERROR",

          statusCode:
            err.statusCode,

          details:
            err.responseBody,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // NETWORK
    // --------------------------------------------------

    if (
      isGenesisApiNetworkError(
        err
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "GENESIS_NETWORK_ERROR",

          details:
            err.cause.message,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // UNKNOWN
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: false,

        error:
          err instanceof Error
            ? err.message
            : "UNKNOWN_ERROR",

        details:
          safeError(err),
      },
      {
        status: 500,
      }
    );
  }
}