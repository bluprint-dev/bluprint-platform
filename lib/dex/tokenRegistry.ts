import { redis } from "@/app/lib/redis";
import { normalizeToken } from "@/lib/dex/normalizeToken";
import type { DexToken } from "@/types/dex";

const METADATA_TTL = 3600;

async function fetchExternalMetadata(
  mint: string
): Promise<Partial<DexToken> | null> {
  try {
    const response = await fetch(
      `https://public-api.solscan.io/token/meta?token=${mint}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "BluPrint/1.0",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      console.error("SOLSCAN_FETCH_FAILED", {
        mint,
        status: response.status,
      });

      return null;
    }

    const data = await response.json();

    const metadata: Partial<DexToken> = {
      name:
        data.name ||
        data.data?.name ||
        "Unknown Token",

      symbol:
        data.symbol ||
        data.data?.symbol ||
        "UNKNOWN",

      imageUrl:
        data.icon ||
        data.data?.icon ||
        data.metadata?.image ||
        "",

      creator:
        data.creator ||
        data.data?.creator ||
        "",

      createdAt:
        data.createdAt ||
        data.data?.createdAt ||
        Date.now(),
    };

    console.log("TOKEN_METADATA_RESULT", {
      mint,
      metadata,
    });

    return metadata;
  } catch (error) {
    console.error("SOLSCAN_METADATA_ERROR", {
      mint,
      error,
    });

    return null;
  }
}

async function resolveTokenMetadata(
  mint: string
): Promise<DexToken> {
  try {
    const cacheKey = `token:metadata:${mint}`;

    const cached = await redis.get(cacheKey);

    if (cached && typeof cached === "string") {
      return normalizeToken({
        mint,
        ...JSON.parse(cached),
      });
    }

    const externalMetadata =
      await fetchExternalMetadata(mint);

    if (externalMetadata) {
      const token = normalizeToken({
        mint,
        ...externalMetadata,
      });

      await redis.set(
        cacheKey,
        JSON.stringify(token),
        {
          ex: METADATA_TTL,
        }
      );

      return token;
    }
  } catch (error) {
    console.error(
      `TOKEN_METADATA_RESOLVE_FAILED: ${mint}`,
      error
    );
  }

  return normalizeToken({ mint });
}

export async function getAllTokenMints(): Promise<
  string[]
> {
  const tokenMints = await redis.smembers(
    "bonding-curve:tokens"
  );

  if (!Array.isArray(tokenMints)) {
    return [];
  }

  return [
    ...new Set(
      tokenMints.filter(
        (mint): mint is string =>
          typeof mint === "string"
      )
    ),
  ];
}

export async function getDexTokenRegistry(options?: {
  limit?: number;
  offset?: number;
}): Promise<{
  tokens: DexToken[];
  total: number;
}> {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const allMints = await getAllTokenMints();

  const paginatedMints = allMints.slice(
    offset,
    offset + limit
  );

  const tokens = await Promise.all(
    paginatedMints.map((mint) =>
      resolveTokenMetadata(mint)
    )
  );

  return {
    tokens: tokens.sort(
      (a, b) =>
        (b.createdAt ?? 0) -
        (a.createdAt ?? 0)
    ),

    total: allMints.length,
  };
}