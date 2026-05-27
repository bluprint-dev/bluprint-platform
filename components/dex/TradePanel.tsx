"use client";

import { Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { DexToken } from "@/types/dex";
import TokenDetailPanel from "./TokenDetailPanel";
import type { BondingCurveInfo } from "@/hooks/useBondingCurveInfo";

type TradePanelProps = {
  token: DexToken | null;
  isBuy: boolean;
  amount: string;
  isSwapping: boolean;
  swapError: string;
  curveInfo?: BondingCurveInfo | null;
  isLoadingCurve?: boolean;
  showDetail?: boolean;
  compact?: boolean;
  onToggleBuy: (isBuy: boolean) => void;
  onAmountChange: (amount: string) => void;
  onSwap: () => void;
};

export default function TradePanel({
  token,
  isBuy,
  amount,
  isSwapping,
  swapError,
  curveInfo,
  isLoadingCurve,
  showDetail = true,
  compact = false,
  onToggleBuy,
  onAmountChange,
  onSwap,
}: TradePanelProps) {
  const { connected } = useWallet();

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 sticky top-24">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#ff2d95]/20 to-[#ff6bcb]/20 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-gray-400">Select a token to start trading</p>
        </div>
      </div>
    );
  }

  const lifecycle = curveInfo?.lifecycle;
  const canTrade = lifecycle?.isSwappable !== false;
  const fillPercent = lifecycle?.fillPercent ?? 0;
  const priceTokensPerSol = curveInfo?.price?.tokensPerSol ? Number(curveInfo.price.tokensPerSol) : null;
  const priceText =
    priceTokensPerSol && Number.isFinite(priceTokensPerSol)
      ? `${priceTokensPerSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol} / SOL`
      : "—";

  return (
    <div
      className={`rounded-3xl border border-white/5 bg-[#12121A]/80 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(255,45,149,0.08)] ${
        compact ? "" : "sticky top-24"
      }`}
    >
      {showDetail && (
        <TokenDetailPanel token={token} curveInfo={curveInfo} isLoadingCurve={isLoadingCurve} />
      )}

      {/* Pump-like quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Price</p>
          <p className="text-white font-bold text-sm truncate">{isLoadingCurve ? "..." : priceText}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Curve Fill</p>
          <p className="text-white font-bold text-sm">
            {isLoadingCurve ? "..." : `${Math.max(0, Math.min(fillPercent, 100)).toFixed(1)}%`}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] transition-all duration-500"
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-5">
        <button
          onClick={() => onToggleBuy(true)}
          className={`flex-1 py-2.5 rounded-lg font-bold transition ${
            isBuy ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-gray-400 hover:text-white"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => onToggleBuy(false)}
          className={`flex-1 py-2.5 rounded-lg font-bold transition ${
            !isBuy ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-white"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">
          {isBuy ? "You pay (SOL)" : "You sell (tokens)"}
        </label>
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
          className="w-full h-12 px-4 rounded-xl bg-[#0A0A0F] border border-white/10 text-white text-lg focus:outline-none focus:border-[#ff2d95]/50 transition"
        />
      </div>

      <div className="flex gap-2 mb-4">
        {(isBuy ? ["0.1", "0.5", "1"] : ["25", "50", "100"]).map((preset) => (
          <button
            key={preset}
            onClick={() => onAmountChange(preset)}
            className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-gray-300 hover:border-[#ff2d95]/30 hover:text-white transition"
          >
            {preset}{isBuy ? " SOL" : "%"}
          </button>
        ))}
      </div>

      <button
        onClick={onSwap}
        disabled={isSwapping || !amount || !connected || !canTrade}
        className={`w-full h-12 rounded-xl font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
          isBuy
            ? "bg-gradient-to-r from-green-500 to-emerald-400 hover:shadow-lg hover:shadow-green-500/20"
            : "bg-gradient-to-r from-red-500 to-rose-400 hover:shadow-lg hover:shadow-red-500/20"
        }`}
      >
        {isSwapping ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : !canTrade ? (
          "Trading unavailable"
        ) : (
          `${isBuy ? "Buy" : "Sell"} ${token.symbol}`
        )}
      </button>

      {swapError && <p className="text-red-400 text-sm mt-3 text-center">{swapError}</p>}

      {!connected && (
        <p className="text-gray-500 text-sm mt-3 text-center">Connect wallet to trade</p>
      )}
    </div>
  );
}
