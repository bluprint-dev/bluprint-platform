import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDexTokens } from "@/services/dex";
import { sortTokensNewest } from "@/lib/dex/normalizeToken";
import { useDexStore } from "@/store/dexStore";
import type { DexToken } from "@/types/dex";
import { useEffect, useMemo } from "react";

export const DEX_TOKENS_QUERY_KEY = ["dex", "tokens"] as const;

// ------------------------------
// SAFE MERGE
// ------------------------------
function mergeTokens(
  server: DexToken[],
  optimistic: DexToken[]
): DexToken[] {
  const map = new Map<string, DexToken>();

  // server first (source of truth)
  for (const token of server) {
    if (!token?.mint) continue;
    map.set(token.mint, token);
  }

  // optimistic overlay
  for (const token of optimistic) {
    if (!token?.mint) continue;
    map.set(token.mint, token);
  }

  return sortTokensNewest(Array.from(map.values()));
}

export function useDexTokens() {
  const optimisticTokens = useDexStore((s) => s.optimisticTokens);
  const clearOptimisticTokens = useDexStore((s) => s.clearOptimisticTokens);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DEX_TOKENS_QUERY_KEY,
    queryFn: () => getDexTokens({ limit: 100 }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const tokens = useMemo(() => {
    const server = query.data?.tokens ?? [];
    return mergeTokens(server, optimisticTokens);
  }, [query.data?.tokens, optimisticTokens]);

  useEffect(() => {
    if (!query.data?.success || optimisticTokens.length === 0) return;

    const serverMints = new Set(
      (query.data.tokens ?? []).map((t) => t.mint)
    );

    const allSynced = optimisticTokens.every((t) =>
      serverMints.has(t.mint)
    );

    if (allSynced) clearOptimisticTokens();
  }, [query.data, optimisticTokens, clearOptimisticTokens]);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: DEX_TOKENS_QUERY_KEY,
    });
    return query.refetch();
  };

  return {
    tokens,
    total: Math.max(query.data?.total ?? 0, tokens.length),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refresh,
  };
}