"use client";

import { useState, useEffect, useRef } from "react";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

interface Token {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  volume24h?: number;
  liquidity?: number;
  priceChange24h?: number;
  holderCount?: number;
  createdAt?: string;
}

const SCAN_URL = "https://solscan.io/token/";

function formatNumber(num?: number): string {
  if (!num) return "—";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  } catch {
    return "—";
  }
}

function PriceChange({ value }: { value?: number }) {
  if (value === undefined || value === null) return <span className="text-gray-600 font-mono text-xs">—</span>;
  const pos = value >= 0;
  return (
    <span className={`font-mono text-xs font-bold ${pos ? "text-emerald-400" : "text-red-400"}`}>
      {pos ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

function TokenAvatar({ token, isBluprint }: { token: Token; isBluprint: boolean }) {
  const [imgError, setImgError] = useState(false);
  if (token.image && !imgError) {
    return (
      <img
        src={token.image}
        alt={token.symbol}
        className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-700"
        onError={() => setImgError(true)}
      />
    );
  }
  const colors = [
    "from-blue-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-cyan-500 to-blue-600",
    "from-violet-500 to-purple-600",
  ];
  const color = colors[token.symbol?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-xs font-black text-white ring-1 ring-gray-700 flex-shrink-0`}>
      {token.symbol?.slice(0, 2) || "?"}
    </div>
  );
}

function TokenRow({ token, index, isBluprint, isNew }: { token: Token; index: number; isBluprint: boolean; isNew?: boolean }) {
  return (
    <div
      className={`group grid grid-cols-[2rem_1fr_auto] md:grid-cols-[2rem_1fr_7rem_6rem_6rem_6rem_5rem] gap-3 items-center px-4 py-3 border-b border-gray-800/40 hover:bg-white/5 cursor-pointer transition-all duration-200 ${isNew ? "animate-pulse-once bg-emerald-500/5" : ""}`}
      onClick={() => window.open(`${SCAN_URL}${token.mint}`, "_blank")}
    >
      {/* Rank */}
      <div className="text-center">
        <span className={`text-xs font-mono font-bold ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-orange-400" : "text-gray-600"}`}>
          {index + 1}
        </span>
      </div>

      {/* Token */}
      <div className="flex items-center gap-3 min-w-0">
        <TokenAvatar token={token} isBluprint={isBluprint} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm truncate">{token.name}</span>
            {isNew && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">NEW</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-gray-500 text-xs font-mono">{token.symbol}</span>
            <span className="text-gray-700 text-xs">·</span>
            {isBluprint ? (
              <span className="text-[10px] text-blue-400 font-medium">BluPrint</span>
            ) : (
              <span className="text-[10px] text-purple-400 font-medium">Jupiter</span>
            )}
          </div>
        </div>
      </div>

      {/* Liquidity */}
      <div className="hidden md:block text-right">
        <div className="text-sm text-white font-mono">{formatNumber(token.liquidity)}</div>
        <div className="text-[10px] text-gray-600 mt-0.5">Liquidity</div>
      </div>

      {/* Volume */}
      <div className="hidden md:block text-right">
        <div className="text-sm text-white font-mono">{formatNumber(token.volume24h)}</div>
        <div className="text-[10px] text-gray-600 mt-0.5">Vol 24h</div>
      </div>

      {/* Price change */}
      <div className="hidden md:block text-right">
        <PriceChange value={token.priceChange24h} />
        <div className="text-[10px] text-gray-600 mt-0.5">24h</div>
      </div>

      {/* Created */}
      <div className="hidden md:block text-right">
        <div className="text-xs text-gray-400 font-mono">{formatTimeAgo(token.createdAt)}</div>
        <div className="text-[10px] text-gray-600 mt-0.5">Created</div>
      </div>

      {/* Arrow */}
      <div className="flex justify-end">
        <span className="text-gray-700 group-hover:text-purple-400 transition-colors text-lg">›</span>
      </div>
    </div>
  );
}

export default function NewPairsPage() {
  const [activeTab, setActiveTab] = useState<"bluprint" | "jupiter">("jupiter");
  const [bluprintTokens, setBluprintTokens] = useState<Token[]>([]);
  const [jupiterTokens, setJupiterTokens] = useState<Token[]>([]);
  const [bluprintLoading, setBluprintLoading] = useState(true);
  const [jupiterLoading, setJupiterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMints, setNewMints] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [ticker, setTicker] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Canlı saat
  useEffect(() => {
    const t = setInterval(() => setTicker((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchBluprintTokens();
  }, []);

  useEffect(() => {
    if (activeTab === "jupiter") {
      fetchJupiterTokens();
    }
  }, [activeTab]);

  // Otomatik yenileme (30 saniye)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (activeTab === "jupiter") fetchJupiterTokens(true);
      else fetchBluprintTokens(true);
    }, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeTab]);

  const fetchBluprintTokens = async (silent = false) => {
    if (!silent) setBluprintLoading(true);
    try {
      const res = await fetch("/api/tokens?limit=50");
      const data = await res.json();
      if (data.success) {
        const valid = data.tokens.filter((t: any) => t.name && t.symbol);
        const prevMints = new Set(bluprintTokens.map((t) => t.mint));
        const fresh = valid.filter((t: any) => !prevMints.has(t.mint)).map((t: any) => t.mint);
        if (fresh.length) {
          setNewMints(new Set(fresh));
          setTimeout(() => setNewMints(new Set()), 5000);
        }
        setBluprintTokens(valid.slice(0, 50));
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBluprintLoading(false);
    }
  };

  const fetchJupiterTokens = async (silent = false) => {
    if (!silent) setJupiterLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jupiter-recent");
      const data = await res.json();
      if (data.success && data.tokens?.length) {
        const prevMints = new Set(jupiterTokens.map((t) => t.mint));
        const fresh = data.tokens.filter((t: any) => !prevMints.has(t.mint)).map((t: any) => t.mint);
        if (fresh.length) {
          setNewMints(new Set(fresh));
          setTimeout(() => setNewMints(new Set()), 5000);
        }
        setJupiterTokens(data.tokens.slice(0, 50));
        setLastUpdated(new Date());
      } else {
        if (!silent) setError(data.error || "No tokens found");
      }
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to fetch");
    } finally {
      setJupiterLoading(false);
    }
  };

  const tokens = activeTab === "bluprint" ? bluprintTokens : jupiterTokens;
  const isLoading = activeTab === "bluprint" ? bluprintLoading : jupiterLoading;

  // Canlı sayaç (kaç saniye önce güncellendi)
  const secondsAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-[#0a0a0f]">
        {/* Arkaplan efektleri */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-blue-950/20 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 pt-20 sm:pt-24 max-w-7xl mx-auto px-3 sm:px-4 pb-16">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">New Pairs</h1>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <LiveDot />
                  <span className="text-emerald-400 text-xs font-bold">LIVE</span>
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-1">
                Updated {secondsAgo}s ago · Auto-refresh every 30s
              </p>
            </div>

            {/* Manuel refresh */}
            <button
              onClick={() => activeTab === "jupiter" ? fetchJupiterTokens() : fetchBluprintTokens()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
            >
              <svg className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Tokens", value: tokens.length.toString(), color: "text-blue-400" },
              { label: "New (5min)", value: newMints.size.toString(), color: "text-emerald-400" },
              { label: "Source", value: activeTab === "bluprint" ? "BluPrint" : "Jupiter", color: "text-purple-400" },
              { label: "Status", value: isLoading ? "Syncing..." : "Live", color: isLoading ? "text-yellow-400" : "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900/60 border border-gray-800/60 rounded-xl px-4 py-3">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-900/60 border border-gray-800/60 rounded-xl p-1 w-fit">
            {[
              { id: "jupiter", label: "Jupiter Recent", icon: "◈" },
              { id: "bluprint", label: "BluPrint Origin", icon: "◆" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? tab.id === "jupiter"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === "jupiter" ? "Jupiter" : "BluPrint"}</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">

            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2rem_1fr_7rem_6rem_6rem_6rem_5rem] gap-3 px-4 py-3 border-b border-gray-800/60 bg-gray-900/60">
              {["#", "Token", "Liquidity", "Vol 24h", "24h %", "Created", ""].map((h, i) => (
                <div key={i} className={`text-[10px] text-gray-600 font-bold uppercase tracking-wider ${i > 1 ? "text-right" : ""}`}>
                  {h}
                </div>
              ))}
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-700" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-t-purple-500 animate-spin" />
                </div>
                <p className="text-gray-600 text-sm">Fetching latest pairs...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="text-4xl">⚠️</div>
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={() => activeTab === "jupiter" ? fetchJupiterTokens() : fetchBluprintTokens()}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition"
                >
                  Try Again
                </button>
              </div>
            ) : tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="text-4xl">🔍</div>
                <p className="text-gray-500 text-sm">No tokens found yet</p>
                {activeTab === "bluprint" && (
                  <a href="/create" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition">
                    Create First Token
                  </a>
                )}
              </div>
            ) : (
              <div>
                {tokens.map((token, idx) => (
                  <TokenRow
                    key={token.mint || idx}
                    token={token}
                    index={idx}
                    isBluprint={activeTab === "bluprint"}
                    isNew={newMints.has(token.mint)}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            {tokens.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-800/60 flex items-center justify-between">
                <span className="text-[10px] text-gray-700">
                  Showing {tokens.length} pairs · Click any row to view on Solscan
                </span>
                <div className="flex items-center gap-1.5">
                  <LiveDot />
                  <span className="text-[10px] text-gray-700">Auto-updating</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>

      <style jsx global>{`
        @keyframes pulse-once {
          0% { background-color: rgba(16, 185, 129, 0.1); }
          50% { background-color: rgba(16, 185, 129, 0.15); }
          100% { background-color: transparent; }
        }
        .animate-pulse-once {
          animation: pulse-once 2s ease-out forwards;
        }
      `}</style>
    </PageTransition>
  );
}