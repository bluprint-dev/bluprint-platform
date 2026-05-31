import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/services/http";

export type BondingCurveInfo = {
  success: boolean;
  genesisAccount?: string;
  bucketPda?: string;
  state?: string;
  lifecycle?: {
    isSwappable: boolean;
    isSoldOut: boolean;
    isGraduated: boolean;
    isFirstBuyPending: boolean;
    fillPercent: number;
  };
  price?: {
    tokensPerSol: string;
    lamportsPerToken: string;
  };
  reserves?: {
    baseReserves: string;
    quoteReserves: string;
  };
  example?: {
    buy1Sol?: {
      amountIn: string;
      amountOut: string;
      fee: string;
    };
  } | null;
};

// ✅ FIX: parametre adı mint → genesisAccount
// Bu hook bonding curve state'ini fetch eder.
// Endpoint /api/bonding-curve/info?genesisAccount=... bekliyor.
// mint (SPL token adresi) burada kullanılmaz — sadece genesisAccount geçerli.
export function useBondingCurveInfo(genesisAccount: string | null) {
  return useQuery({
    queryKey: ["dex", "curve", genesisAccount], // ✅ cache key de genesisAccount
    queryFn: () =>
      fetchJson<BondingCurveInfo>(
        `/api/bonding-curve/info?genesisAccount=${encodeURIComponent(genesisAccount!)}`,
        { timeoutMs: 12_000 }
      ),
    enabled: Boolean(genesisAccount),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}