"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, Sparkles, TrendingUp } from "lucide-react";
import Footer from "@/app/components/Footer";
import DexHeader from "@/components/dex/Header";
import StatsBar from "@/components/dex/StatsBar";
import SearchBar from "@/components/dex/SearchBar";
import TokenList from "@/components/dex/TokenList";
import TradePanel from "@/components/dex/TradePanel";
import TokenModal from "@/components/dex/TokenModal";
import LoadingSkeleton from "@/components/dex/LoadingSkeleton";
import EmptyState from "@/components/dex/EmptyState";
import ErrorState from "@/components/dex/ErrorState";
import { useDexTokens } from "@/hooks/useDexTokens";
import { useBondingCurveInfo } from "@/hooks/useBondingCurveInfo";
import { useSwap } from "@/hooks/useSwap";
import { useDexStore } from "@/store/dexStore";
import { filterTokens } from "@/lib/dex/normalizeToken";

type SortMode = "newest" | "name";

export default function DexPageContent() {
  const searchParams = useSearchParams();
  const mintFromUrl = searchParams.get("mint");

  const {
    search,
    selectedMint,
    isBuy,
    amount,
    setSearch,
    selectToken,
    setIsBuy,
    setAmount,
    resetTrade,
  } = useDexStore();

  const { tokens, total, isLoading, isFetching, isError, error, refresh } = useDexTokens();
  const { swap, isSwapping, error: swapError, setError: setSwapError } = useSwap();
  const [mobileTradeOpen, setMobileTradeOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const filteredTokens = useMemo(() => {
    const base = filterTokens(tokens, search);
    const copy = [...base];
    if (sortMode === "newest") {
      copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    } else if (sortMode === "name") {
      copy.sort((a, b) => (a.symbol ?? "").localeCompare(b.symbol ?? ""));
    }
    return copy;
  }, [tokens, search, sortMode]);

  const selectedToken = useMemo(
    () => tokens.find((t) => t.mint === selectedMint) ?? null,
    [tokens, selectedMint]
  );

  const { data: curveInfo, isLoading: isLoadingCurve } = useBondingCurveInfo(selectedMint);

  useEffect(() => {
    if (mintFromUrl && tokens.some((t) => t.mint === mintFromUrl)) {
      selectToken(mintFromUrl);
    }
  }, [mintFromUrl, tokens, selectToken]);

  const handleSelectToken = (token: typeof tokens[0]) => {
    selectToken(token.mint);
    setSwapError("");
    if (window.innerWidth < 1024) setMobileTradeOpen(true);
  };

  const handleSwap = async () => {
    if (!selectedToken || !amount) return;
    const ok = await swap({ mint: selectedToken.mint, amount, isBuy });
    if (ok) {
      resetTrade();
      setMobileTradeOpen(false);
    }
  };

  const tradePanelProps = {
    token: selectedToken,
    isBuy,
    amount,
    isSwapping,
    swapError,
    curveInfo: curveInfo ?? null,
    isLoadingCurve,
    onToggleBuy: setIsBuy,
    onAmountChange: setAmount,
    onSwap: handleSwap,
  };

  return (
    <div className="min-h-screen relative">
      {/* Premium background layers (pump-like vibe, BluPrint palette) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-10 h-[520px] w-[520px] rounded-full bg-[#ff2d95]/10 blur-[140px]" />
        <div className="absolute top-[20%] right-10 h-[460px] w-[460px] rounded-full bg-[#7c3aed]/10 blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[25%] h-[420px] w-[420px] rounded-full bg-[#ff6bcb]/10 blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,rgba(255,45,149,0.7)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <DexHeader onRefresh={() => refresh()} isRefreshing={isFetching} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6">
          <div className="pointer-events-none absolute inset-0 opacity-[0.5] bg-[radial-gradient(circle_at_20%_10%,rgba(255,45,149,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.16),transparent_45%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                <Sparkles className="w-3.5 h-3.5 text-[#ff2d95]" />
                Pump-style bonding curve trading
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">
                Trade the <span className="text-[#ff2d95]">newest</span> launches on BluPrint
              </h2>
              <p className="mt-2 text-sm text-gray-400 max-w-2xl">
                Instant swaps, live curve info, and a clean terminal-grade UI that matches BluPrint’s pink-whale theme.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/create"
                className="inline-flex items-center justify-center h-11 px-5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white text-sm font-semibold shadow-[0_0_35px_rgba(255,45,149,0.22)] hover:shadow-[0_0_55px_rgba(255,45,149,0.32)] transition"
              >
                Launch token
              </Link>
              <a
                href="#market"
                className="inline-flex items-center justify-center h-11 px-5 rounded-2xl border border-white/10 bg-white/5 text-gray-200 text-sm hover:border-[#ff2d95]/40 hover:text-white transition"
              >
                View market
              </a>
            </div>
          </div>
        </div>

        <StatsBar totalTokens={total} isLoading={isLoading} />

        <div id="market" className="grid lg:grid-cols-3 gap-6 scroll-mt-28">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <SearchBar value={search} onChange={setSearch} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortMode((m) => (m === "newest" ? "name" : "newest"))}
                  className="inline-flex items-center gap-2 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-gray-200 hover:border-[#ff2d95]/40 hover:text-white transition"
                >
                  <ArrowUpDown className="w-4 h-4 text-[#ff2d95]" />
                  <span className="text-sm font-medium">
                    {sortMode === "newest" ? "Newest" : "Name"}
                  </span>
                </button>

                <div className="hidden sm:flex items-center gap-2 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-mono">{isFetching ? "syncing" : "live"}</span>
                </div>
              </div>
            </div>

            {/* List container (premium card) */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs text-gray-500">
                    {isLoading ? "Loading market..." : `${filteredTokens.length} tokens`}
                  </p>
                </div>
                <p className="text-[10px] text-gray-600 font-mono">
                  {isFetching ? "syncing..." : "synced"}
                </p>
              </div>

              {isLoading ? (
                <LoadingSkeleton />
              ) : isError ? (
                <ErrorState
                  message={error instanceof Error ? error.message : undefined}
                  onRetry={() => refresh()}
                />
              ) : filteredTokens.length === 0 ? (
                <EmptyState hasSearch={Boolean(search.trim())} />
              ) : (
                <TokenList
                  tokens={filteredTokens}
                  selectedMint={selectedMint}
                  onSelect={handleSelectToken}
                />
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <TradePanel {...tradePanelProps} />
          </div>
        </div>
      </div>

      <TokenModal
        token={selectedToken}
        open={mobileTradeOpen}
        curveInfo={curveInfo ?? null}
        isLoadingCurve={isLoadingCurve}
        onClose={() => setMobileTradeOpen(false)}
      >
        <TradePanel {...tradePanelProps} showDetail={false} compact />
      </TokenModal>

      <Footer />
    </div>
  );
}
