"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Crown,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  DollarSign,
  Zap,
  Rocket,
  Star,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
} from "lucide-react";

interface Token {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  bondingProgress: number;
  age: string;
  image: string;
  isTrending: boolean;
  isNew: boolean;
  isBoosted: boolean;
  isVerified: boolean;
  txCount24h: number;
}

export default function DexPage() {
  const { connected } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"volume24h" | "price" | "bondingProgress" | "marketCap">("volume24h");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [activityFeed, setActivityFeed] = useState<Array<{type: string, token: string, amount: number, timestamp: Date}>>([]);

  // Live Activity Feed Simülasyonu
  useEffect(() => {
    const activities = [
      { type: "buy", token: "PEPEKING", amount: 3.2 },
      { type: "sell", token: "CATWIF", amount: 1.1 },
      { type: "launch", token: "MOONDOG", amount: 0 },
      { type: "boost", token: "FROGX", amount: 0 },
      { type: "buy", token: "BONK", amount: 5.4 },
      { type: "sell", token: "WIF", amount: 2.3 },
      { type: "migrate", token: "POPCAT", amount: 0 },
    ];

    const interval = setInterval(() => {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      setActivityFeed(prev => [
        { ...randomActivity, timestamp: new Date() },
        ...prev.slice(0, 19)
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Mock token verileri
  useEffect(() => {
    const mockTokens: Token[] = [
      {
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "PEPEKING",
        name: "Pepe King",
        price: 0.0000234,
        priceChange24h: 156.4,
        volume24h: 1250000,
        marketCap: 89000000,
        liquidity: 1250000,
        bondingProgress: 72,
        age: "2m",
        image: "🐸",
        isTrending: true,
        isNew: false,
        isBoosted: true,
        isVerified: false,
        txCount24h: 3421,
      },
      {
        address: "So11111111111111111111111111111111111111112",
        symbol: "FROGX",
        name: "Frog X",
        price: 2.45,
        priceChange24h: 45.2,
        volume24h: 890000,
        marketCap: 245000000,
        liquidity: 890000,
        bondingProgress: 45,
        age: "1m",
        image: "🐸",
        isTrending: true,
        isNew: true,
        isBoosted: true,
        isVerified: true,
        txCount24h: 2156,
      },
      {
        address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        symbol: "MOONCAT",
        name: "Moon Cat",
        price: 0.89,
        priceChange24h: -12.5,
        volume24h: 456000,
        marketCap: 89000000,
        liquidity: 456000,
        bondingProgress: 23,
        age: "3m",
        image: "🐱",
        isTrending: false,
        isNew: false,
        isBoosted: false,
        isVerified: false,
        txCount24h: 892,
      },
      {
        address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
        symbol: "MOONDOG",
        name: "Moon Dog",
        price: 0.0056,
        priceChange24h: 234.8,
        volume24h: 2340000,
        marketCap: 123000000,
        liquidity: 2340000,
        bondingProgress: 91,
        age: "1m",
        image: "🐕",
        isTrending: true,
        isNew: true,
        isBoosted: false,
        isVerified: false,
        txCount24h: 5678,
      },
      {
        address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
        symbol: "CATWIF",
        name: "Cat Wif Hat",
        price: 0.0123,
        priceChange24h: 23.4,
        volume24h: 234000,
        marketCap: 45600000,
        liquidity: 234000,
        bondingProgress: 18,
        age: "6m",
        image: "🐱",
        isTrending: false,
        isNew: false,
        isBoosted: false,
        isVerified: false,
        txCount24h: 456,
      },
    ];

    setTimeout(() => {
      setTokens(mockTokens);
      setIsLoading(false);
    }, 1000);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(4);
    if (price < 0.00001) return price.toFixed(8);
    if (price < 0.001) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const filteredTokens = tokens
    .filter(token => token.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'buy': return <ArrowUpRight className="w-3 h-3 text-green-400" />;
      case 'sell': return <ArrowDownRight className="w-3 h-3 text-red-400" />;
      case 'launch': return <Rocket className="w-3 h-3 text-purple-400" />;
      case 'boost': return <Crown className="w-3 h-3 text-pink-400" />;
      case 'migrate': return <ExternalLink className="w-3 h-3 text-blue-400" />;
      default: return <Zap className="w-3 h-3 text-yellow-400" />;
    }
  };

  const getActivityText = (activity: {type: string, token: string, amount: number}) => {
    switch(activity.type) {
      case 'buy': return `🟢 ${activity.amount} SOL buy — ${activity.token}`;
      case 'sell': return `🔴 ${activity.amount} SOL sell — ${activity.token}`;
      case 'launch': return `🚀 New token launched — ${activity.token}`;
      case 'boost': return `⭐ BOOST purchased — ${activity.token}`;
      case 'migrate': return `🔄 Token migrated — ${activity.token}`;
      default: return `⚡ Activity on ${activity.token}`;
    }
  };

  const sortOptions = [
    { key: "volume24h" as const, label: "Volume" },
    { key: "price" as const, label: "Price" },
    { key: "bondingProgress" as const, label: "Bonding" },
    { key: "marketCap" as const, label: "Market Cap" },
  ];

  return (
    <div className="min-h-screen bg-[#050507]">
      {/* Top Stats Bar */}
      <div className="sticky top-0 z-30 border-b border-[#ff2d95]/10 bg-[#050507]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A22]/50 border border-[#ff2d95]/10">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-white">124 tokens launched today</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A22]/50 border border-[#ff2d95]/10">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white">2,341 active traders</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A22]/50 border border-[#ff2d95]/10">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white">$421K volume</span>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-[#1A1A22]/50 border border-[#ff2d95]/15 text-white placeholder-[#8E8E93] focus:border-[#ff2d95] transition-all w-64"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* SOL PANEL - LIVE TOKEN FEED */}
          <div className="lg:col-span-4 space-y-4">
            {/* Sort Tabs */}
            <div className="flex gap-2 pb-2 border-b border-[#ff2d95]/10 overflow-x-auto">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    if (sortBy === option.key) {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    } else {
                      setSortBy(option.key);
                      setSortOrder("desc");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    sortBy === option.key
                      ? "bg-[#ff2d95]/20 text-[#ff2d95] border border-[#ff2d95]/30"
                      : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  {option.label}
                  {sortBy === option.key && <span className="ml-1">{sortOrder === "desc" ? "↓" : "↑"}</span>}
                </button>
              ))}
            </div>

            {/* Token List - Live Feed */}
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-[#141414] rounded-xl p-3 border border-[#252525]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1A1A22]" />
                      <div className="flex-1">
                        <div className="h-4 w-20 bg-[#1A1A22] rounded" />
                        <div className="h-3 w-16 bg-[#1A1A22] rounded mt-1" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <AnimatePresence>
                  {filteredTokens.map((token, index) => (
                    <motion.div
                      key={token.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedToken(token)}
                      className={`bg-[#141414] rounded-xl p-3 border transition-all duration-200 cursor-pointer ${
                        selectedToken?.address === token.address
                          ? "border-[#ff2d95] shadow-[0_0_20px_rgba(255,45,149,0.15)]"
                          : "border-[#252525] hover:border-[#ff2d95]/30 hover:bg-[#1A1A22]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{token.image}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{token.symbol}</span>
                            {token.isBoosted && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff2d95]/20 text-[#ff2d95]">
                                <Crown className="w-2 h-2" />
                                BOOSTED
                              </span>
                            )}
                            {token.isNew && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                NEW
                              </span>
                            )}
                            {token.isVerified && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#8E8E93]">{formatPrice(token.price)}</span>
                            <span className={`text-xs flex items-center gap-0.5 ${token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {token.priceChange24h >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {Math.abs(token.priceChange24h)}%
                            </span>
                          </div>
                          {/* Bonding Progress Bar */}
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-[#8E8E93] mb-0.5">
                              <span>Bonding Progress</span>
                              <span>{token.bondingProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full rounded-full bg-gradient-to-r from-[#ff2d95] to-[#7c3aed]"
                                initial={{ width: 0 }}
                                animate={{ width: `${token.bondingProgress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#8E8E93]">Vol</div>
                          <div className="text-sm font-semibold text-white">{formatNumber(token.volume24h)}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* ORTA PANEL - CHART + TRADING */}
          <div className="lg:col-span-5 space-y-4">
            {selectedToken ? (
              <>
                {/* Token Header */}
                <div className="bg-[#141414] rounded-2xl border border-[#252525] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{selectedToken.image}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-white">{selectedToken.symbol}</h2>
                          {selectedToken.isBoosted && <Crown className="w-4 h-4 text-[#ff2d95]" />}
                          {selectedToken.isVerified && <Award className="w-4 h-4 text-blue-400" />}
                        </div>
                        <p className="text-sm text-[#8E8E93]">{selectedToken.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${formatPrice(selectedToken.price)}</div>
                      <div className={`flex items-center justify-end gap-1 ${selectedToken.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {selectedToken.priceChange24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(selectedToken.priceChange24h)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini Chart - Animated */}
                <div className="bg-[#141414] rounded-2xl border border-[#252525] p-4">
                  <div className="h-48 relative">
                    <svg className="w-full h-full">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ff2d95" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ff2d95" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M0,120 C30,100 60,80 90,90 C120,100 150,60 180,50 C210,40 240,70 270,40 C300,10 330,30 360,20"
                        fill="none"
                        stroke="#ff2d95"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1 }}
                      />
                      <motion.path
                        d="M0,120 C30,100 60,80 90,90 C120,100 150,60 180,50 C210,40 240,70 270,40 C300,10 330,30 360,20"
                        fill="url(#chartGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                      />
                    </svg>
                  </div>
                </div>

                {/* Buy/Sell Panel */}
                <div className="bg-[#141414] rounded-2xl border border-[#252525] p-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab("buy")}
                      className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === "buy"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-[#1A1A22] text-[#8E8E93] hover:text-white"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setActiveTab("sell")}
                      className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === "sell"
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                          : "bg-[#1A1A22] text-[#8E8E93] hover:text-white"
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-[#8E8E93] mb-1 block">Amount (SOL)</label>
                      <div className="flex gap-2 mb-2">
                        {[0.1, 0.5, 1, 5].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setBuyAmount(amount.toString())}
                            className="px-3 py-1 text-xs rounded-lg bg-[#1A1A22] text-[#8E8E93] hover:text-[#ff2d95] transition"
                          >
                            {amount} SOL
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={activeTab === "buy" ? buyAmount : sellAmount}
                        onChange={(e) => activeTab === "buy" ? setBuyAmount(e.target.value) : setSellAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#252525] text-white focus:border-[#ff2d95] transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#8E8E93] mb-1 block">You get</label>
                      <div className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#252525] text-[#ff2d95] font-medium">
                        ~{(parseFloat(activeTab === "buy" ? buyAmount || "0" : sellAmount || "0") * selectedToken.price).toFixed(6)} {selectedToken.symbol}
                      </div>
                    </div>

                    <button
                      disabled={!connected}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        activeTab === "buy"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/30"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/30"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {!connected ? "Connect Wallet" : activeTab === "buy" ? `Buy ${selectedToken.symbol}` : `Sell ${selectedToken.symbol}`}
                    </button>
                  </div>
                </div>

                {/* Token Stats */}
                <div className="bg-[#141414] rounded-2xl border border-[#252525] p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#8E8E93]">Market Cap</p>
                      <p className="text-white font-semibold">{formatNumber(selectedToken.marketCap)}</p>
                    </div>
                    <div>
                      <p className="text-[#8E8E93]">Liquidity</p>
                      <p className="text-white font-semibold">{formatNumber(selectedToken.liquidity)}</p>
                    </div>
                    <div>
                      <p className="text-[#8E8E93]">24h Volume</p>
                      <p className="text-white font-semibold">{formatNumber(selectedToken.volume24h)}</p>
                    </div>
                    <div>
                      <p className="text-[#8E8E93]">24h TX</p>
                      <p className="text-white font-semibold">{selectedToken.txCount24h.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#141414] rounded-2xl border border-[#252525] p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#1A1A22] flex items-center justify-center">
                  <BarChart3 className="w-10 h-10 text-[#8E8E93]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a Token</h3>
                <p className="text-sm text-[#8E8E93]">Choose a token from the left panel to start trading</p>
              </div>
            )}
          </div>

          {/* SAĞ PANEL - LIVE ACTIVITY FEED */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] rounded-2xl border border-[#252525] p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#ff2d95] animate-pulse" />
                <h3 className="font-semibold text-white">Live Activity</h3>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400">LIVE</span>
                </div>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {activityFeed.map((activity, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#1A1A22]/30 text-xs"
                    >
                      {getActivityIcon(activity.type)}
                      <span className="text-[#8E8E93] flex-1">{getActivityText(activity)}</span>
                      <span className="text-[10px] text-[#8E8E93]">
                        {activity.timestamp.toLocaleTimeString()}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Boosted Tokens - Featured */}
            <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] rounded-2xl border border-[#ff2d95]/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-[#ff2d95]" />
                <h3 className="font-semibold text-white">🔥 BOOSTED</h3>
              </div>
              <div className="space-y-2">
                {tokens.filter(t => t.isBoosted).map((token) => (
                  <div key={token.address} className="flex items-center gap-3 p-2 rounded-xl bg-[#1A1A22]/50 border border-[#ff2d95]/10">
                    <div className="text-2xl">{token.image}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{token.symbol}</div>
                      <div className="text-xs text-[#ff2d95]">+{token.priceChange24h}%</div>
                    </div>
                    <button className="px-3 py-1 text-xs rounded-lg bg-[#ff2d95]/20 text-[#ff2d95] hover:bg-[#ff2d95]/30 transition">
                      Trade
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}