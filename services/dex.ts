import type { DexToken, DexTokensResponse, SwapBuildResponse } from "@/types/dex";
import { fetchJson, withRetry } from "@/services/http";
import { normalizeToken, sortTokensNewest } from "@/lib/dex/normalizeToken";

function mergeToken(existing: DexToken | undefined, incoming: Partial<DexToken> & { mint: string }): DexToken {
  if (!existing) return normalizeToken(incoming);

  // Prefer incoming only when it actually has useful values.
  const merged: Partial<DexToken> & { mint: string } = {
    mint: incoming.mint,
    name: incoming.name?.trim() ? incoming.name : existing.name,
    symbol: incoming.symbol?.trim() ? incoming.symbol : existing.symbol,
    imageUrl: incoming.imageUrl?.trim() ? incoming.imageUrl : existing.imageUrl,
    creator: incoming.creator?.trim() ? incoming.creator : existing.creator,
    createdAt: incoming.createdAt ?? existing.createdAt,
  };

  return normalizeToken(merged);
}

function mergeTokenResponses(responses: DexTokensResponse[]): DexTokensResponse {
  const map = new Map<string, DexToken>();

  for (const response of responses) {
    for (const token of response.tokens ?? []) {
      if (!token?.mint) continue;
      const existing = map.get(token.mint);
      map.set(token.mint, mergeToken(existing, token));
    }
  }

  const tokens = sortTokensNewest(Array.from(map.values()));
  const total = Math.max(...responses.map((r) => r.total ?? 0), tokens.length);

  return { success: true, tokens, total };
}

export async function getDexTokens(params?: {
  limit?: number;
  offset?: number;
}): Promise<DexTokensResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));

  const primaryUrl = `/api/tokens${search.toString() ? `?${search}` : ""}`;
  const fallbackUrl = `/api/bonding-curve/tokens`;

  const fetchPrimary = () =>
    withRetry(() => fetchJson<DexTokensResponse>(primaryUrl, { timeoutMs: 10_000 }), {
      retries: 2,
    });

  const fetchFallback = () =>
    fetchJson<DexTokensResponse>(fallbackUrl, { timeoutMs: 12_000 });

  try {
    const [primary, fallback] = await Promise.allSettled([fetchPrimary(), fetchFallback()]);
    const results: DexTokensResponse[] = [];

    if (primary.status === "fulfilled" && primary.value.success) results.push(primary.value);
    if (fallback.status === "fulfilled" && fallback.value.success) results.push(fallback.value);

    if (results.length > 0) return mergeTokenResponses(results);

    throw new Error(
      primary.status === "rejected"
        ? primary.reason instanceof Error
          ? primary.reason.message
          : "Primary fetch failed"
        : "No token data available"
    );
  } catch (err) {
    return fetchFallback();
  }
}

export async function buildSwapTx(input: {
  mintAddress: string;
  amountLamports: string;
  userPublicKey: string;
  isBuy: boolean;
}): Promise<SwapBuildResponse> {
  return await withRetry(
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

