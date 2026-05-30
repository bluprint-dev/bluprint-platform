import type {
  DexToken,
  DexTokensResponse,
  SwapBuildResponse,
} from "@/types/dex";
import { fetchJson, withRetry } from "@/services/http";
import { normalizeToken, sortTokensNewest } from "@/lib/dex/normalizeToken";

// ------------------------------
// SAFE TOKEN MERGE
// ------------------------------
function mergeToken(
  existing: DexToken | undefined,
  incoming: Partial<DexToken> & { mint: string }
): DexToken {
  if (!existing) return normalizeToken(incoming);

  return normalizeToken({
    mint: incoming.mint,

    genesisAccount:
      incoming.genesisAccount || existing.genesisAccount || "",

    name: incoming.name?.trim() || existing.name,
    symbol: incoming.symbol?.trim() || existing.symbol,
    imageUrl: incoming.imageUrl || existing.imageUrl,

    creator: incoming.creator || existing.creator,
    createdAt: incoming.createdAt || existing.createdAt,
  });
}

// ------------------------------
// SAFE RESPONSE MERGE
// ------------------------------
function mergeTokenResponses(
  responses: DexTokensResponse[]
): DexTokensResponse {
  const map = new Map<string, DexToken>();

  for (const response of responses) {
    const tokens = response.tokens ?? [];

    for (const token of tokens) {
      if (!token?.mint) continue;

      const existing = map.get(token.mint);
      map.set(token.mint, mergeToken(existing, token));
    }
  }

  const tokens = sortTokensNewest(Array.from(map.values()));

  const total = Math.max(
    ...responses.map((r) => r.total ?? 0),
    tokens.length
  );

  return {
    success: true,
    tokens,
    total,
  };
}

// ------------------------------
// GET TOKENS (FINAL SAFE FLOW)
// ------------------------------
export async function getDexTokens(params?: {
  limit?: number;
  offset?: number;
}): Promise<DexTokensResponse> {
  const search = new URLSearchParams();

  if (params?.limit != null) {
    search.set("limit", String(params.limit));
  }

  if (params?.offset != null) {
    search.set("offset", String(params.offset));
  }

  const primaryUrl = `/api/tokens${
    search.toString() ? `?${search.toString()}` : ""
  }`;

  const fallbackUrl = `/api/bonding-curve/tokens`;

  const fetchPrimary = () =>
    withRetry(
      () =>
        fetchJson<DexTokensResponse>(primaryUrl, {
          timeoutMs: 10_000,
        }),
      { retries: 2 }
    );

  const fetchFallback = () =>
    fetchJson<DexTokensResponse>(fallbackUrl, {
      timeoutMs: 12_000,
    });

  try {
    const [primary, fallback] = await Promise.allSettled([
      fetchPrimary(),
      fetchFallback(),
    ]);

    const results: DexTokensResponse[] = [];

    if (primary.status === "fulfilled" && primary.value.success) {
      results.push(primary.value);
    }

    if (fallback.status === "fulfilled" && fallback.value.success) {
      results.push(fallback.value);
    }

    if (results.length > 0) {
      return mergeTokenResponses(results);
    }

    throw new Error(
      primary.status === "rejected"
        ? primary.reason?.message || "Primary failed"
        : "No data"
    );
  } catch {
    return fetchFallback();
  }
}

// ------------------------------
// SWAP BUILD (UNCHANGED LOGIC SAFE)
// ------------------------------
export async function buildSwapTx(input: {
  mintAddress: string;
  amountLamports: string;
  userPublicKey: string;
  isBuy: boolean;
}): Promise<SwapBuildResponse> {
  return withRetry(
    () =>
      fetchJson<SwapBuildResponse>(`/api/bonding-curve/swap`, {
        method: "POST",
        timeoutMs: 20_000,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mintAddress: input.mintAddress,
          amount: input.amountLamports,
          userPublicKey: input.userPublicKey,
          isBuy: input.isBuy,
        }),
      }),
    { retries: 1, baseDelayMs: 400 }
  );
}