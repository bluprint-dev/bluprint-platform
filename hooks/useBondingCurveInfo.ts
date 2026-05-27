import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/services/http";

export type BondingCurveInfo = {
  success: boolean;
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
    quoteTokenDepositTotal: string;
    baseTokenBalance: string;
  };
};

export function useBondingCurveInfo(mint: string | null) {
  return useQuery({
    queryKey: ["dex", "curve", mint],
    queryFn: () =>
      fetchJson<BondingCurveInfo>(
        `/api/bonding-curve/info?genesisAccount=${encodeURIComponent(mint!)}`,
        { timeoutMs: 12_000 }
      ),
    enabled: Boolean(mint),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
