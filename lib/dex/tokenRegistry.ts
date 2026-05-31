import { redis } from "@/app/lib/redis";
import { normalizeToken } from "@/lib/dex/normalizeToken";
import type { DexToken } from "@/types/dex";

const METADATA_TTL = 3600;

// ------------------------------
// EXTERNAL METADATA FETCH
// mint bazlı — Solscan token metadata için mint adresi gerekir
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
          "User-Agent": "BluPrint/1.0",
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
      name:        data.name        || data.data?.name        || "Unknown Token",
      symbol:      data.symbol      || data.data?.symbol      || "UNKNOWN",
      imageUrl:    data.icon        || data.data?.icon        || data.metadata?.image || "",
      creator:     data.creator     || data.data?.creator     || "",
      createdAt:   data.createdAt   || data.data?.createdAt   || Date.now(),
    };

    console.log("TOKEN_METADATA_RESULT", { mint, metadata });
    return metadata;
  } catch (error) {
    console.error("SOLSCAN_METADATA_ERROR", { mint, error });
    return null;
  }
}

// ------------------------------
// RESOLVE TOKEN METADATA
//
// ✅ FIX: Bu fonksiyon artık genesisAccount alıyor.
// Adımlar:
//   1. genesis:mint:{genesisAccount} → mintAddress lookup
//   2. token:metadata:{mintAddress} → cached metadata
//   3. Yoksa Solscan'dan çek, cache'e yaz
//   4. genesisAccount token objesine ekleniyor
// ------------------------------
async function resolveTokenMetadata(
  genesisAccount: string
): Promise<DexToken> {
  try {
    // 1) genesisAccount → mintAddress reverse lookup
    const mintAddress = await redis.get(`genesis:mint:${genesisAccount}`) as string | null;

    // mintAddress bulunamazsa genesisAccount'u mint olarak kullan (eski kayıtlar)
    const mint = mintAddress ?? genesisAccount;

    const cacheKey = `token:metadata:${mint}`;
    const cached = await redis.get(cacheKey);

    if (cached && typeof cached === "string") {
      const parsed = JSON.parse(cached);
      return normalizeToken({
        mint,
        genesisAccount,  // ✅ her zaman genesisAccount'u ekle
        ...parsed,
      });
    }

    // 2) Solscan'dan external metadata çek
    const externalMetadata = await fetchExternalMetadata(mint);

    if (externalMetadata) {
      const token = normalizeToken({
        mint,
        genesisAccount,  // ✅ genesisAccount token objesine ekleniyor
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

  // Fallback: sadece genesisAccount ile minimal token
  return normalizeToken({
    mint: genesisAccount,  // fallback olarak genesisAccount'u mint yerine kullan
    genesisAccount,
  });
}

// ------------------------------
// ✅ FIX: getAllTokenMints → getAllGenesisAccounts
// bonding-curve:tokens set'i artık genesisAccount'ları tutuyor
// (launch/route.ts ve track-launch/route.ts düzeltildi)
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

// Backward compat export — eski çağrılar varsa hata vermez
// @deprecated getAllGenesisAccounts kullan
export const getAllTokenMints = getAllGenesisAccounts;

// ------------------------------
// DEX TOKEN REGISTRY
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

  // ✅ FIX: set'ten genesisAccount'lar okunuyor
  const allGenesisAccounts = await getAllGenesisAccounts();

  const paginated = allGenesisAccounts.slice(offset, offset + limit);

  // ✅ FIX: her genesisAccount için metadata resolve ediliyor
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