import { redis } from "@/app/lib/redis";
import { normalizeToken } from "@/lib/dex/normalizeToken";
import type { DexToken } from "@/types/dex";

const METADATA_TTL = 3600;

// ------------------------------
// EXTERNAL METADATA FETCH
// ------------------------------
async function fetchExternalMetadata(
  mint: string
): Promise<Partial<DexToken> | null> {
  try {
    const response = await fetch(
      `https://public-api.solscan.io/token/meta?token=${mint}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Axor/1.0",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      console.error("SOLSCAN_FETCH_FAILED", { mint, status: response.status });
      return null;
    }

    const data = await response.json();

    const metadata: Partial<DexToken> = {
      name:      data.name      || data.data?.name      || "Unknown Token",
      symbol:    data.symbol    || data.data?.symbol    || "UNKNOWN",
      imageUrl:  data.icon      || data.data?.icon      || data.metadata?.image || "",
      creator:   data.creator   || data.data?.creator   || "",
      createdAt: data.createdAt || data.data?.createdAt || Date.now(),
    };

    console.log("TOKEN_METADATA_RESULT", { mint, metadata });
    return metadata;
  } catch (error) {
    console.error("SOLSCAN_METADATA_ERROR", { mint, error });
    return null;
  }
}

// ------------------------------
// SAFE PARSE
// Upstash Redis bazen string, bazen otomatik parse edilmiş obje döndürür.
// Bu helper her iki durumu da handle eder.
// ------------------------------
function safeParse(value: unknown): Record<string, unknown> | null {
  if (!value) return null;

  // Zaten obje (Upstash auto-parsed)
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  // String ise parse et
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return null;
}

// ------------------------------
// RESOLVE TOKEN METADATA
// ------------------------------
async function resolveTokenMetadata(
  genesisAccount: string
): Promise<DexToken> {
  try {
    // 1) genesisAccount → mintAddress reverse lookup
    const mintAddress = await redis.get(`genesis:mint:${genesisAccount}`) as string | null;
    const mint = mintAddress ?? genesisAccount;

    const cacheKey = `token:metadata:${mint}`;
    const cached = await redis.get(cacheKey);

    // ✅ FIX: Upstash string veya obje dönebilir, safeParse her ikisini handle eder
    const parsed = safeParse(cached);

    if (parsed) {
      return normalizeToken({
        mint,
        genesisAccount,
        ...parsed,
      });
    }

    // 2) Cache miss — Solscan'dan çek
    const externalMetadata = await fetchExternalMetadata(mint);

    if (externalMetadata) {
      const token = normalizeToken({
        mint,
        genesisAccount,
        ...externalMetadata,
      });

      await redis.set(
        cacheKey,
        JSON.stringify(token),
        { ex: METADATA_TTL }
      );

      return token;
    }
  } catch (error) {
    console.error(`TOKEN_METADATA_RESOLVE_FAILED: genesisAccount=${genesisAccount}`, error);
  }

  return normalizeToken({
    mint: genesisAccount,
    genesisAccount,
  });
}

// ------------------------------
// getAllGenesisAccounts
// ------------------------------
export async function getAllGenesisAccounts(): Promise<string[]> {
  const genesisAccounts = await redis.smembers("bonding-curve:tokens");

  if (!Array.isArray(genesisAccounts)) {
    return [];
  }

  return [
    ...new Set(
      genesisAccounts.filter(
        (g): g is string => typeof g === "string"
      )
    ),
  ];
}

// @deprecated
export const getAllTokenMints = getAllGenesisAccounts;

// ------------------------------
// getDexTokenRegistry
// ------------------------------
export async function getDexTokenRegistry(options?: {
  limit?: number;
  offset?: number;
}): Promise<{
  tokens: DexToken[];
  total: number;
}> {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const allGenesisAccounts = await getAllGenesisAccounts();
  const paginated = allGenesisAccounts.slice(offset, offset + limit);

  const tokens = await Promise.all(
    paginated.map((genesisAccount) =>
      resolveTokenMetadata(genesisAccount)
    )
  );

  return {
    tokens: tokens.sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    ),
    total: allGenesisAccounts.length,
  };
}