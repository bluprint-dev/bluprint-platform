"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction, Transaction } from "@solana/web3.js";
import {
  Search, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown,
  ExternalLink, Copy, Check, AlertCircle, Loader2, Activity,
  Zap, X, Flame, ChevronRight, Wallet,
} from "lucide-react";

interface Token {
  mint: string;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  createdAt: number;
}

interface BucketInfo {
  lifecycle: { isSwappable: boolean; isSoldOut: boolean; isGraduated: boolean; fillPercent: number };
  reserves: { virtualSol: string; virtualTokens: string };
  price: { tokensPerSol: string; lamportsPerToken: string };
  fees: { creatorFeeAccrued: string };
}

interface SwapQuote {
  amountOut: string;
  amountIn: string;
  fee: string;
  creatorFee: string;
}

export default function DexPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [bucketInfo, setBucketInfo] = useState<BucketInfo | null>(null);
  const [bucketLoading, setBucketLoading] = useState(false);
  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState("");
  const [swapSuccess, setSwapSuccess] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bonding-curve/tokens");
      const data = await res.json();
      if (data.success) setTokens(data.tokens);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const selectToken = async (token: Token) => {
    setSelectedToken(token);
    setBucketInfo(null);
    setQuote(null);
    setAmount("");
    setSwapError("");
    setSwapSuccess("");
    setBucketLoading(true);
    try {
      const res = await fetch(`/api/bonding-curve/info?genesisAccount=${token.mint}`);
      const data = await res.json();
      if (data.success) setBucketInfo(data);
    } catch (e) { console.error(e); }
    finally { setBucketLoading(false); }
  };

  const fetchQuote = useCallback(async () => {
    if (!selectedToken || !amount || isNaN(Number(amount)) || Number(amount) <= 0) { setQuote(null); return; }
    setQuoteLoading(true);
    try {
      const lamports = Math.floor(Number(amount) * 1_000_000_000);
      const res = await fetch(`/api/bonding-curve/quote?mint=${selectedToken.mint}&amount=${lamports}&isBuy=${isBuy}`);
      const data = await res.json();
      if (data.success) setQuote(data.quote); else setQuote(null);
    } catch { setQuote(null); }
    finally { setQuoteLoading(false); }
  }, [selectedToken, amount, isBuy]);

  useEffect(() => { const t = setTimeout(fetchQuote, 500); return () => clearTimeout(t); }, [fetchQuote]);

  const handleSwap = async () => {
    if (!connected || !publicKey) { setVisible(true); return; }
    if (!selectedToken || !amount || !quote) return;
    setSwapping(true); setSwapError(""); setSwapSuccess("");
    try {
      const lamports = Math.floor(Number(amount) * 1_000_000_000);
      const res = await fetch("/api/bonding-curve/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mintAddress: selectedToken.mint, amount: lamports.toString(), userPublicKey: publicKey.toString(), isBuy }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Swap failed");
      const txBytes = Buffer.from(data.transaction, "base64");
      let signedTx: any;
      try { const vtx = VersionedTransaction.deserialize(txBytes); signedTx = await (window as any).solana.signTransaction(vtx); }
      catch { const tx = Transaction.from(txBytes); signedTx = await (window as any).solana.signTransaction(tx); }
      const sig = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setSwapSuccess(sig); setAmount(""); setQuote(null);
      setTimeout(() => selectToken(selectedToken), 1500);
    } catch (err: any) {
      setSwapError(err.message?.includes("rejected") ? "Transaction cancelled" : err.message || "Swap failed");
    } finally { setSwapping(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const fmtSOL = (lamports: string) => (Number(lamports) / 1e9).toFixed(4);
  const fmtLarge = (n: number) => n >= 1e9 ? `${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `${(n/1e3).toFixed(2)}K` : n.toFixed(4);
  const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m`;
    if (s < 86400) return `${Math.floor(s/3600)}h`;
    return `${Math.floor(s/86400)}d`;
  };

  const filtered = tokens.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
    t.mint?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative z-10 min-h-screen" style={{ background: "transparent" }}>

      {/* ── TOPBAR ── */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0F]/90 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#ff2d95]" />
              <span className="text-white font-black text-base tracking-tight">DEX</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ff2d95]/15 text-[#ff2d95] border border-[#ff2d95]/20">BETA</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <span className="hidden sm:block text-xs text-gray-600">Bonding Curve Trading</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border font-medium transition ${
              connected
                ? "bg-green-500/8 border-green-500/20 text-green-400"
                : "bg-white/4 border-white/10 text-gray-500"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              {connected ? `${publicKey?.toString().slice(0,4)}…${publicKey?.toString().slice(-4)}` : "Disconnected"}
            </div>
            <button
              onClick={fetchTokens}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/6 text-gray-600 hover:text-gray-300 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-5">
        <div className="flex gap-5" style={{ alignItems: "flex-start" }}>

          {/* ── LEFT: TOKEN LIST ── */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, symbol or address..."
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none transition"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(255,45,149,0.35)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Column headers */}
            <div className="grid items-center px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-700"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 80px" }}>
              <span>Token</span>
              <span className="text-right">Progress</span>
              <span className="text-right">Age</span>
              <span className="text-right">Trade</span>
            </div>

            {/* Token rows */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-6 h-6 text-[#ff2d95] animate-spin" />
                <span className="text-xs text-gray-700">Loading tokens...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Activity className="w-8 h-8 text-gray-800" />
                <p className="text-sm text-gray-700">No tokens yet</p>
                <a href="/create" className="text-xs text-[#ff2d95] hover:underline">Create the first one →</a>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((token, i) => {
                  const isSelected = selectedToken?.mint === token.mint;
                  return (
                    <motion.div
                      key={token.mint}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      onClick={() => selectToken(token)}
                      className="grid items-center px-3 py-3 rounded-xl cursor-pointer transition-all group"
                      style={{
                        gridTemplateColumns: "2fr 1fr 1fr 80px",
                        background: isSelected ? "rgba(255,45,149,0.07)" : "rgba(255,255,255,0.025)",
                        border: `1px solid ${isSelected ? "rgba(255,45,149,0.25)" : "rgba(255,255,255,0.05)"}`,
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                    >
                      {/* Token info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {token.imageUrl ? (
                          <img src={token.imageUrl} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10" onError={e => { (e.target as any).style.display="none"; }} />
                        ) : (
                          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs text-[#ff2d95]"
                            style={{ background: "rgba(255,45,149,0.12)", border: "1px solid rgba(255,45,149,0.15)" }}>
                            {token.symbol?.slice(0,2) || "??"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white truncate">{token.symbol || "???"}</span>
                            {i < 3 && <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />}
                          </div>
                          <span className="text-[11px] text-gray-600 truncate block">{token.name || "Unknown"}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="flex justify-end">
                        <div className="w-20">
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full" style={{ width: "50%", background: "linear-gradient(90deg,#ff2d95,#ff6bcb)" }} />
                          </div>
                          <div className="text-[10px] text-gray-700 mt-0.5 text-right">50%</div>
                        </div>
                      </div>

                      {/* Age */}
                      <div className="text-right">
                        <span className="text-[11px] text-gray-600">
                          {token.createdAt ? timeAgo(token.createdAt) : "—"}
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="flex justify-end">
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSelected ? "text-white" : "text-[#ff2d95] group-hover:text-white"
                        }`}
                          style={{
                            background: isSelected ? "#ff2d95" : "rgba(255,45,149,0.1)",
                            border: "1px solid rgba(255,45,149,0.2)",
                          }}>
                          Trade
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: SWAP PANEL ── */}
          <div className="w-[360px] flex-shrink-0 space-y-3" style={{ position: "sticky", top: "80px" }}>
            {!selectedToken ? (
              <div className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,45,149,0.1)", border: "1px solid rgba(255,45,149,0.15)" }}>
                  <Zap className="w-5 h-5 text-[#ff2d95]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Select a token</p>
                  <p className="text-xs text-gray-600 leading-relaxed">Pick any token from the list to start trading on the bonding curve</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={selectedToken.mint} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

                  {/* Token card */}
                  <div className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {selectedToken.imageUrl ? (
                          <img src={selectedToken.imageUrl} className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-[#ff2d95]"
                            style={{ background: "rgba(255,45,149,0.12)" }}>
                            {selectedToken.symbol?.slice(0,2)}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-white text-base leading-none">{selectedToken.symbol}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{selectedToken.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => window.open(`https://solscan.io/token/${selectedToken.mint}`,"_blank")}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/6 text-gray-600 hover:text-gray-300 transition">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => copy(selectedToken.mint,"mint")}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/6 text-gray-600 hover:text-gray-300 transition">
                          {copied==="mint" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setSelectedToken(null)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/6 text-gray-600 hover:text-gray-300 transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {bucketLoading ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="w-4 h-4 text-[#ff2d95] animate-spin" />
                      </div>
                    ) : bucketInfo ? (
                      <div className="space-y-3">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1.5">
                            <span className="text-gray-600">Bonding curve</span>
                            <span className="font-bold" style={{ color: "#ff2d95" }}>{bucketInfo.lifecycle.fillPercent?.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bucketInfo.lifecycle.fillPercent || 0}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: "linear-gradient(90deg,#ff2d95,#ff6bcb)" }}
                            />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Virtual SOL", value: `${fmtSOL(bucketInfo.reserves.virtualSol)} SOL` },
                            { label: "Creator fees", value: `${fmtSOL(bucketInfo.fees.creatorFeeAccrued)} SOL` },
                          ].map(s => (
                            <div key={s.label} className="rounded-xl p-2.5"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <p className="text-[10px] text-gray-700 mb-0.5">{s.label}</p>
                              <p className="text-xs font-bold text-white">{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Status */}
                        <div className="flex gap-1.5 flex-wrap">
                          {bucketInfo.lifecycle.isGraduated && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                              🎓 Graduated
                            </span>
                          )}
                          {bucketInfo.lifecycle.isSoldOut && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                              Sold Out
                            </span>
                          )}
                          {bucketInfo.lifecycle.isSwappable && !bucketInfo.lifecycle.isGraduated && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                              ● Live
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Swap box */}
                  {bucketInfo?.lifecycle.isSwappable && !bucketInfo?.lifecycle.isGraduated && (
                    <div className="rounded-2xl p-4 space-y-3"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

                      {/* Buy / Sell */}
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.3)" }}>
                        {[
                          { label: "Buy", val: true, icon: TrendingUp, active: "rgba(34,197,94,0.15)", activeBorder: "rgba(34,197,94,0.3)", activeText: "#4ade80" },
                          { label: "Sell", val: false, icon: TrendingDown, active: "rgba(239,68,68,0.15)", activeBorder: "rgba(239,68,68,0.3)", activeText: "#f87171" },
                        ].map(btn => {
                          const active = isBuy === btn.val;
                          return (
                            <button key={btn.label}
                              onClick={() => { setIsBuy(btn.val); setQuote(null); }}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition"
                              style={{
                                background: active ? btn.active : "transparent",
                                border: `1px solid ${active ? btn.activeBorder : "transparent"}`,
                                color: active ? btn.activeText : "#6b7280",
                              }}>
                              <btn.icon className="w-3.5 h-3.5" />
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Amount input */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1.5">
                          <span className="text-gray-600">{isBuy ? "You pay" : "You sell"}</span>
                          <span className="text-gray-700">{isBuy ? "SOL" : selectedToken.symbol}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-12 px-4 pr-14 rounded-xl text-white text-base font-bold placeholder-gray-800 focus:outline-none transition"
                            style={{
                              background: "rgba(0,0,0,0.4)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(255,45,149,0.4)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                            {isBuy ? "SOL" : selectedToken.symbol}
                          </span>
                        </div>

                        {isBuy && (
                          <div className="flex gap-1.5 mt-2">
                            {["0.1","0.5","1","5"].map(v => (
                              <button key={v} onClick={() => setAmount(v)}
                                className="flex-1 h-7 text-[11px] font-semibold rounded-lg transition"
                                style={{
                                  background: amount === v ? "rgba(255,45,149,0.15)" : "rgba(255,255,255,0.04)",
                                  border: `1px solid ${amount === v ? "rgba(255,45,149,0.3)" : "rgba(255,255,255,0.06)"}`,
                                  color: amount === v ? "#ff2d95" : "#6b7280",
                                }}>
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Divider arrow */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                        <div className="w-7 h-7 flex items-center justify-center rounded-lg"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <ArrowUpDown className="w-3 h-3 text-gray-600" />
                        </div>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                      </div>

                      {/* Quote */}
                      <div className="rounded-xl p-3 min-h-[64px]"
                        style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {quoteLoading ? (
                          <div className="flex items-center gap-2 h-full">
                            <Loader2 className="w-3.5 h-3.5 text-[#ff2d95] animate-spin" />
                            <span className="text-[11px] text-gray-600">Calculating...</span>
                          </div>
                        ) : quote ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">You receive</span>
                              <span className="text-sm font-black text-white">
                                {isBuy
                                  ? `${fmtLarge(Number(quote.amountOut)/1e9)} ${selectedToken.symbol}`
                                  : `${(Number(quote.amountOut)/1e9).toFixed(6)} SOL`}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-700">Fee</span>
                              <span className="text-gray-600">{(Number(quote.fee)/1e9).toFixed(6)} SOL</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-700">Creator fee</span>
                              <span className="text-gray-600">{(Number(quote.creatorFee)/1e9).toFixed(6)} SOL</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-700 flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Enter amount for instant quote
                          </p>
                        )}
                      </div>

                      {/* Errors / Success */}
                      {swapError && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {swapError}
                        </div>
                      )}
                      {swapSuccess && (
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs"
                          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)", color: "#4ade80" }}>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                            Swap confirmed!
                          </div>
                          <button onClick={() => window.open(`https://solscan.io/tx/${swapSuccess}`,"_blank")}
                            className="underline opacity-70 hover:opacity-100">
                            View
                          </button>
                        </div>
                      )}

                      {/* Swap button */}
                      <button
                        onClick={handleSwap}
                        disabled={swapping || !amount || !quote}
                        className="w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-35"
                        style={{
                          background: swapping || !amount || !quote
                            ? "rgba(255,255,255,0.06)"
                            : !connected
                            ? "rgba(255,45,149,0.8)"
                            : isBuy
                            ? "linear-gradient(135deg,#22c55e,#16a34a)"
                            : "linear-gradient(135deg,#ef4444,#dc2626)",
                          color: "white",
                          boxShadow: (!swapping && amount && quote)
                            ? isBuy ? "0 4px 20px rgba(34,197,94,0.25)" : "0 4px 20px rgba(239,68,68,0.25)"
                            : "none",
                        }}>
                        {swapping ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Confirming...</>
                        ) : !connected ? (
                          <><Wallet className="w-4 h-4" />Connect Wallet</>
                        ) : (
                          <>{isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isBuy ? "Buy" : "Sell"} {selectedToken.symbol}</>
                        )}
                      </button>

                      <p className="text-center text-[10px] text-gray-800">1% slippage · Powered by Metaplex Genesis</p>
                    </div>
                  )}

                  {/* Graduated */}
                  {bucketInfo?.lifecycle.isGraduated && (
                    <div className="rounded-2xl p-5 text-center space-y-3"
                      style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                      <div className="text-2xl">🎓</div>
                      <p className="text-white font-bold text-sm">Token Graduated!</p>
                      <p className="text-xs text-gray-600">Now trading on Raydium with full liquidity.</p>
                      <button
                        onClick={() => window.open(`https://raydium.io/swap/?outputMint=${selectedToken.mint}`,"_blank")}
                        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition hover:opacity-80"
                        style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa" }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                        Trade on Raydium
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}