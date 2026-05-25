"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction, Transaction } from "@solana/web3.js";
import {
  Search, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown,
  ExternalLink, Copy, Check, AlertCircle, Loader2, ChevronDown,
  Activity, Zap, BarChart3, X,
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
  lifecycle: {
    isSwappable: boolean;
    isSoldOut: boolean;
    isGraduated: boolean;
    fillPercent: number;
  };
  reserves: {
    virtualSol: string;
    virtualTokens: string;
  };
  price: {
    tokensPerSol: string;
    lamportsPerToken: string;
  };
  fees: {
    creatorFeeAccrued: string;
  };
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      console.error(e);
    } finally {
      setBucketLoading(false);
    }
  };

  const fetchQuote = useCallback(async () => {
    if (!selectedToken || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setQuote(null);
      return;
    }
    setQuoteLoading(true);
    try {
      const lamports = Math.floor(Number(amount) * 1_000_000_000);
      const res = await fetch(
        `/api/bonding-curve/quote?mint=${selectedToken.mint}&amount=${lamports}&isBuy=${isBuy}`
      );
      const data = await res.json();
      if (data.success) setQuote(data.quote);
      else setQuote(null);
    } catch {
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [selectedToken, amount, isBuy]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 500);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  const handleSwap = async () => {
    if (!connected || !publicKey) { setVisible(true); return; }
    if (!selectedToken || !amount || !quote) return;

    setSwapping(true);
    setSwapError("");
    setSwapSuccess("");

    try {
      const lamports = Math.floor(Number(amount) * 1_000_000_000);
      const res = await fetch("/api/bonding-curve/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mintAddress: selectedToken.mint,
          amount: lamports.toString(),
          userPublicKey: publicKey.toString(),
          isBuy,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Swap failed");

      const txBytes = Buffer.from(data.transaction, "base64");
      let signedTx: any;
      try {
        const vtx = VersionedTransaction.deserialize(txBytes);
        signedTx = await (window as any).solana.signTransaction(vtx);
      } catch {
        const tx = Transaction.from(txBytes);
        signedTx = await (window as any).solana.signTransaction(tx);
      }

      const sig = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      setSwapSuccess(sig);
      setAmount("");
      setQuote(null);
      setTimeout(() => selectToken(selectedToken), 1500);
    } catch (err: any) {
      if (err.message?.includes("rejected") || err.message?.includes("User rejected")) {
        setSwapError("Transaction cancelled");
      } else {
        setSwapError(err.message || "Swap failed");
      }
    } finally {
      setSwapping(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatSOL = (lamports: string) =>
    (Number(lamports) / 1_000_000_000).toFixed(4);

  const formatLarge = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n.toFixed(2);
  };

  const filtered = tokens.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      t.mint?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative z-10 min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[#1A1A1A] bg-[#0A0A0F]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff2d95] to-[#ff6bcb] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff2d95]/20">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">DEX</h1>
              <p className="text-xs text-gray-600 mt-0.5">Bonding curve trading</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${
              connected ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-gray-500 border border-white/10"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              {connected ? `${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}` : "Not connected"}
            </div>
            <button onClick={fetchTokens} className="p-2 rounded-lg hover:bg-white/5 transition">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">

          {/* LEFT — Token List */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111111] border border-[#1E1E1E] text-white placeholder-gray-700 focus:outline-none focus:border-[#ff2d95]/40 transition text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {/* Token Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#ff2d95] animate-spin" />
                  <span className="text-sm text-gray-600">Loading tokens...</span>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-600 text-sm">No tokens found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs text-gray-600 font-medium uppercase tracking-wider">
                  <span>Token</span>
                  <span className="text-right">Progress</span>
                  <span className="text-right hidden sm:block">Status</span>
                  <span className="text-right">Action</span>
                </div>

                {filtered.map((token, i) => (
                  <motion.div
                    key={token.mint}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => selectToken(token)}
                    className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3.5 rounded-xl border cursor-pointer transition group ${
                      selectedToken?.mint === token.mint
                        ? "bg-[#ff2d95]/5 border-[#ff2d95]/30"
                        : "bg-[#111111] border-[#1A1A1A] hover:border-[#ff2d95]/20 hover:bg-[#111111]"
                    }`}
                  >
                    {/* Token info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {token.imageUrl ? (
                        <img
                          src={token.imageUrl}
                          alt={token.symbol}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => { (e.target as any).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff2d95]/20 to-[#ff6bcb]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#ff2d95]">{token.symbol?.slice(0, 2)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white">{token.symbol || "???"}</span>
                        </div>
                        <span className="text-xs text-gray-600 truncate block">{token.name || "Unknown"}</span>
                      </div>
                    </div>

                    {/* Progress placeholder — real data from bucket info */}
                    <div className="text-right hidden sm:block">
                      <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] rounded-full"
                          style={{ width: "50%" }}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="hidden sm:flex justify-end">
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/15 font-medium">
                        Live
                      </span>
                    </div>

                    {/* Action */}
                    <button className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedToken?.mint === token.mint
                        ? "bg-[#ff2d95] text-white"
                        : "bg-[#ff2d95]/10 text-[#ff2d95] group-hover:bg-[#ff2d95]/20"
                    }`}>
                      Trade
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Swap Panel */}
          <div className="lg:sticky lg:top-24 space-y-4 self-start">
            {!selectedToken ? (
              <div className="bg-[#111111] rounded-2xl border border-[#1E1E1E] p-8 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#ff2d95]/10 border border-[#ff2d95]/15 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#ff2d95]" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold mb-1">Select a token</p>
                  <p className="text-xs text-gray-600">Choose a token from the list to start trading</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedToken.mint}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Token header */}
                  <div className="bg-[#111111] rounded-2xl border border-[#1E1E1E] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {selectedToken.imageUrl ? (
                          <img src={selectedToken.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#ff2d95]/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-[#ff2d95]">{selectedToken.symbol?.slice(0, 2)}</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-white">{selectedToken.symbol}</h3>
                          <p className="text-xs text-gray-600">{selectedToken.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`https://solscan.io/token/${selectedToken.mint}`, "_blank")}
                          className="p-2 rounded-lg hover:bg-white/5 transition"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(selectedToken.mint, "mint")}
                          className="p-2 rounded-lg hover:bg-white/5 transition"
                        >
                          {copied === "mint" ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedToken(null)}
                          className="p-2 rounded-lg hover:bg-white/5 transition"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Bucket Info */}
                    {bucketLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 text-[#ff2d95] animate-spin" />
                      </div>
                    ) : bucketInfo ? (
                      <div className="space-y-3">
                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-600">Bonding progress</span>
                            <span className="text-[#ff2d95] font-medium">
                              {bucketInfo.lifecycle.fillPercent?.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bucketInfo.lifecycle.fillPercent || 0}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] rounded-full"
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#0D0D0D] rounded-xl p-3 border border-[#1A1A1A]">
                            <p className="text-xs text-gray-600 mb-1">Virtual SOL</p>
                            <p className="text-sm font-bold text-white">
                              {formatSOL(bucketInfo.reserves.virtualSol)} SOL
                            </p>
                          </div>
                          <div className="bg-[#0D0D0D] rounded-xl p-3 border border-[#1A1A1A]">
                            <p className="text-xs text-gray-600 mb-1">Creator fees</p>
                            <p className="text-sm font-bold text-white">
                              {formatSOL(bucketInfo.fees.creatorFeeAccrued)} SOL
                            </p>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex gap-2 flex-wrap">
                          {bucketInfo.lifecycle.isGraduated && (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                              🎓 Graduated
                            </span>
                          )}
                          {bucketInfo.lifecycle.isSoldOut && (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                              Sold Out
                            </span>
                          )}
                          {bucketInfo.lifecycle.isSwappable && !bucketInfo.lifecycle.isGraduated && (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                              ● Tradeable
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Swap Panel */}
                  {bucketInfo?.lifecycle.isSwappable && !bucketInfo?.lifecycle.isGraduated && (
                    <div className="bg-[#111111] rounded-2xl border border-[#1E1E1E] p-5 space-y-4">
                      {/* Buy / Sell toggle */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[#0D0D0D] rounded-xl">
                        <button
                          onClick={() => { setIsBuy(true); setQuote(null); }}
                          className={`py-2.5 rounded-lg text-sm font-semibold transition ${
                            isBuy
                              ? "bg-green-500/20 text-green-400 border border-green-500/25"
                              : "text-gray-600 hover:text-gray-400"
                          }`}
                        >
                          <TrendingUp className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                          Buy
                        </button>
                        <button
                          onClick={() => { setIsBuy(false); setQuote(null); }}
                          className={`py-2.5 rounded-lg text-sm font-semibold transition ${
                            !isBuy
                              ? "bg-red-500/20 text-red-400 border border-red-500/25"
                              : "text-gray-600 hover:text-gray-400"
                          }`}
                        >
                          <TrendingDown className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                          Sell
                        </button>
                      </div>

                      {/* Amount input */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          {isBuy ? "You pay (SOL)" : "You sell (tokens)"}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3.5 pr-16 rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] text-white placeholder-gray-700 focus:outline-none focus:border-[#ff2d95]/40 transition text-sm"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                            {isBuy ? "SOL" : selectedToken.symbol}
                          </span>
                        </div>
                        {/* Quick amounts */}
                        {isBuy && (
                          <div className="flex gap-2 mt-2">
                            {["0.1", "0.5", "1", "5"].map((v) => (
                              <button
                                key={v}
                                onClick={() => setAmount(v)}
                                className="flex-1 py-1.5 text-xs rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-gray-500 hover:text-white hover:border-[#ff2d95]/30 transition"
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-center">
                          <ArrowUpDown className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="bg-[#0D0D0D] rounded-xl p-4 border border-[#1A1A1A] min-h-[60px]">
                        {quoteLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-[#ff2d95] animate-spin" />
                            <span className="text-xs text-gray-600">Getting quote...</span>
                          </div>
                        ) : quote ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">You receive</span>
                              <span className="text-white font-bold">
                                {isBuy
                                  ? `${formatLarge(Number(quote.amountOut) / 1_000_000_000)} ${selectedToken.symbol}`
                                  : `${(Number(quote.amountOut) / 1_000_000_000).toFixed(6)} SOL`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-700">Platform fee</span>
                              <span className="text-gray-600">
                                {(Number(quote.fee) / 1_000_000_000).toFixed(6)} SOL
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-700">Creator fee</span>
                              <span className="text-gray-600">
                                {(Number(quote.creatorFee) / 1_000_000_000).toFixed(6)} SOL
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-700">Enter an amount to see quote</p>
                        )}
                      </div>

                      {/* Error / Success */}
                      {swapError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-xs text-red-400">{swapError}</p>
                        </div>
                      )}
                      {swapSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-green-400">Swap successful!</p>
                            <button
                              onClick={() => window.open(`https://solscan.io/tx/${swapSuccess}`, "_blank")}
                              className="text-xs text-green-400/60 hover:text-green-400 underline truncate block"
                            >
                              View transaction
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Swap button */}
                      <button
                        onClick={handleSwap}
                        disabled={swapping || !amount || !quote}
                        className={`w-full py-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                          isBuy
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 shadow-lg shadow-green-500/20"
                            : "bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90 shadow-lg shadow-red-500/20"
                        } text-white disabled:opacity-40`}
                      >
                        {swapping ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Swapping...</>
                        ) : !connected ? (
                          "Connect Wallet"
                        ) : (
                          <>{isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isBuy ? "Buy" : "Sell"} {selectedToken.symbol}</>
                        )}
                      </button>

                      <p className="text-xs text-gray-700 text-center">
                        1% slippage protection applied
                      </p>
                    </div>
                  )}

                  {bucketInfo?.lifecycle.isGraduated && (
                    <div className="bg-[#111111] rounded-2xl border border-blue-500/20 p-5 text-center space-y-3">
                      <div className="text-3xl">🎓</div>
                      <p className="text-white font-semibold">Token Graduated!</p>
                      <p className="text-xs text-gray-600">This token has graduated to Raydium. Trade there for full liquidity.</p>
                      <button
                        onClick={() => window.open(`https://raydium.io/swap/?outputMint=${selectedToken.mint}`, "_blank")}
                        className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
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