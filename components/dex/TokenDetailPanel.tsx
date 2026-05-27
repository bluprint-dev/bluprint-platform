"use client";

import { ExternalLink } from "lucide-react";
import type { DexToken } from "@/types/dex";
import { shortMint } from "@/lib/dex/normalizeToken";
import type { BondingCurveInfo } from "@/hooks/useBondingCurveInfo";

type TokenDetailPanelProps = {
  token: DexToken;
  curveInfo?: BondingCurveInfo | null;
  isLoadingCurve?: boolean;
};

export default function TokenDetailPanel({
  token,
  curveInfo,
  isLoadingCurve,
}: TokenDetailPanelProps) {
  const fillPercent = curveInfo?.lifecycle?.fillPercent ?? 0;
  const price = curveInfo?.price?.tokensPerSol;

  return (
    <div className="space-y-4 pb-6 border-b border-white/5">
      <div className="flex items-center gap-3">
        {token.imageUrl ? (
          <img
            src={token.imageUrl}
            alt={token.symbol}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-[#ff2d95]/30"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#7c3aed] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">{token.symbol.charAt(0) || "?"}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl">{token.symbol}</span>
            <span className="text-xs text-gray-500 truncate">{token.name}</span>
          </div>
          <p className="text-xs text-gray-600 font-mono">{shortMint(token.mint, 8, 6)}</p>
          <button
            onClick={() => window.open(`https://solscan.io/token/${token.mint}`, "_blank")}
            className="mt-1 text-xs text-gray-500 hover:text-[#ff2d95] transition flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            View on Solscan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
          <p className="text-xs text-gray-500 mb-1">Curve Fill</p>
          <p className="text-white font-bold">
            {isLoadingCurve ? "..." : `${fillPercent.toFixed(1)}%`}
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
          <p className="text-xs text-gray-500 mb-1">Price</p>
          <p className="text-white font-bold text-sm truncate">
            {isLoadingCurve ? "..." : price ? `${Number(price).toLocaleString()} / SOL` : "—"}
          </p>
        </div>
      </div>

      {curveInfo?.lifecycle && (
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] transition-all duration-500"
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
