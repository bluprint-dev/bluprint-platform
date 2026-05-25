"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Crown,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  TrendingUp,
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
  age: string;
  ageMinutes: number;
  image: string;
  isTrending: boolean;
  isNew: boolean;
}

export default function DexPage() {
  const { connected } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"volume24h" | "price" | "ageMinutes" | "marketCap">("volume24h");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "6h" | "24h">("5m");

  // Mock token verileri
  useEffect(() => {
    const mockTokens: Token[] = [
      {
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "BONK",
        name: "Bonk",
        price: 0.00000234,
        priceChange24h: 156.4,
        volume24h: 1250000,
        marketCap: 89000000,
        liquidity: 1250000,
        age: "2m",
        ageMinutes: 2,
        image: "🔥",
        isTrending: true,
        isNew: false,
      },
      {
        address: "So11111111111111111111111111111111111111112",
        symbol: "WIF",
        name: "Dogwifhat",
        price: 2.45,
        priceChange24h: 45.2,
        volume24h: 890000,
        marketCap: 245000000,
        liquidity: 890000,
        age: "1m",
        ageMinutes: 1,
        image: "🐕",
        isTrending: true,
        isNew: false,
      },
      {
        address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        symbol: "POPCAT",
        name: "Popcat",
        price: 0.89,
        priceChange24h: -12.5,
        volume24h: 456000,
        marketCap: 89000000,
        liquidity: 456000,
        age: "3m",
        ageMinutes: 3,
        image: "🐱",
        isTrending: false,
        isNew: false,
      },
      {
        address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
        symbol: "MEW",
        name: "Cat in a Dogs World",
        price: 0.0056,
        priceChange24h: 234.8,
        volume24h: 2340000,
        marketCap: 123000000,
        liquidity: 2340000,
        age: "1m",
        ageMinutes: 1,
        image: "🐱",
        isTrending: true,
        isNew: true,
      },
      {
        address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
        symbol: "SAMO",
        name: "Samoyed Coin",
        price: 0.0123,
        priceChange24h: 23.4,
        volume24h: 234000,
        marketCap: 45600000,
        liquidity: 234000,
        age: "6m",
        ageMinutes: 6,
        image: "🐕",
        isTrending: false,
        isNew: false,
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
    .filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

  const sortOptions: { key: "volume24h" | "price" | "ageMinutes" | "marketCap"; label: string }[] = [
    { key: "volume24h", label: "Volume" },
    { key: "price", label: "Price" },
    { key: "ageMinutes", label: "New" },
    { key: "marketCap", label: "Market Cap" },
  ];

  return (
    <div className="min-h-screen bg-[#0A192F]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[#233554] bg-[#0A192F]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#64FFDA] to-[#4ECDC4] rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#0A192F]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BluPrint DEX</h1>
                <p className="text-xs text-[#8892B0]">Trade meme coins instantly</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#112240] border border-[#233554]">
                <Activity className="w-4 h-4 text-[#64FFDA]" />
                <span className="text-sm text-white">$4.2M</span>
                <span className="text-xs text-[#8892B0]">24h Volume</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#112240] border border-[#233554]">
                <Users className="w-4 h-4 text-[#64FFDA]" />
                <span className="text-sm text-white">1,234</span>
                <span className="text-xs text-[#8892B0]">Active Traders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol Taraf - Token Listesi */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892B0]" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#112240] border border-[#233554] text-white placeholder-[#8892B0] focus:outline-none focus:border-[#64FFDA] transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-xl bg-[#112240] border border-[#233554] text-[#8892B0] hover:border-[#64FFDA] hover:text-[#64FFDA] transition-all">
                  <Filter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                    }, 1000);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#112240] border border-[#233554] text-[#8892B0] hover:border-[#64FFDA] hover:text-[#64FFDA] transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sort Tabs */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-[#233554]">
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    sortBy === option.key
                      ? "bg-[#1A365D] text-[#64FFDA] border border-[#64FFDA]/30"
                      : "text-[#8892B0] hover:text-white"
                  }`}
                >
                  {option.label}
                  {sortBy === option.key && (
                    <span className="ml-1">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Token List */}
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-[#112240] rounded-xl p-4 border border-[#233554]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1A365D]" />
                        <div>
                          <div className="h-4 w-20 bg-[#1A365D] rounded" />
                          <div className="h-3 w-16 bg-[#1A365D] rounded mt-1" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-16 bg-[#1A365D] rounded" />
                        <div className="h-3 w-12 bg-[#1A365D] rounded mt-1" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                filteredTokens.map((token, index) => (
                  <motion.div
                    key={token.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedToken(token)}
                    className={`bg-[#112240] rounded-xl p-4 border transition-all duration-200 cursor-pointer ${
                      selectedToken?.address === token.address
                        ? "border-[#64FFDA] shadow-lg shadow-[#64FFDA]/20"
                        : "border-[#233554] hover:border-[#64FFDA]/50 hover:bg-[#1A365D]/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A365D] to-[#0A192F] flex items-center justify-center text-xl border border-[#64FFDA]/30">
                          {token.image}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{token.symbol}</span>
                            {token.isTrending && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#64FFDA]/20 text-[#64FFDA]">
                                <TrendingUp className="w-2.5 h-2.5" />
                                TRENDING
                              </span>
                            )}
                            {token.isNew && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8892B0]">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">${formatPrice(token.price)}</div>
                        <div className={`flex items-center gap-1 text-sm ${token.priceChange24h >= 0 ? "text-[#64FFDA]" : "text-red-400"}`}>
                          {token.priceChange24h >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(token.priceChange24h).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#233554] text-xs">
                      <div>
                        <p className="text-[#8892B0]">Volume</p>
                        <p className="text-white">{formatNumber(token.volume24h)}</p>
                      </div>
                      <div>
                        <p className="text-[#8892B0]">Market Cap</p>
                        <p className="text-white">{formatNumber(token.marketCap)}</p>
                      </div>
                      <div>
                        <p className="text-[#8892B0]">Age</p>
                        <p className="text-white">{token.age}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Sağ Taraf - Trading Panel */}
          <div className="space-y-4">
            {selectedToken ? (
              <>
                <div className="bg-[#112240] rounded-2xl border border-[#233554] p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A365D] to-[#0A192F] flex items-center justify-center text-2xl border border-[#64FFDA]/30">
                      {selectedToken.image}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{selectedToken.symbol}</h2>
                        {selectedToken.isTrending && <Crown className="w-4 h-4 text-[#64FFDA]" />}
                      </div>
                      <p className="text-sm text-[#8892B0]">{selectedToken.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0A192F] rounded-xl p-3 text-center">
                      <p className="text-xs text-[#8892B0]">Price</p>
                      <p className="text-xl font-bold text-white">${formatPrice(selectedToken.price)}</p>
                    </div>
                    <div className="bg-[#0A192F] rounded-xl p-3 text-center">
                      <p className="text-xs text-[#8892B0]">24h Change</p>
                      <p className={`text-xl font-bold ${selectedToken.priceChange24h >= 0 ? "text-[#64FFDA]" : "text-red-400"}`}>
                        {selectedToken.priceChange24h >= 0 ? "+" : ""}{selectedToken.priceChange24h.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {(["1m", "5m", "15m", "1h", "6h", "24h"] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                          timeframe === tf
                            ? "bg-[#1A365D] text-[#64FFDA]"
                            : "text-[#8892B0] hover:text-white"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <div className="h-24 mb-4 bg-[#0A192F] rounded-xl flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-16">
                      {[45, 52, 48, 55, 62, 58, 65, 70, 68, 72, 75, 78, 82, 80, 85, 88, 92, 95, 98, 100].map((height, i) => (
                        <div
                          key={i}
                          className="w-2 bg-gradient-to-t from-[#64FFDA] to-[#4ECDC4] rounded-t"
                          style={{ height: `${height * 0.6}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab("buy")}
                      className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === "buy"
                          ? "bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] text-[#0A192F]"
                          : "bg-[#0A192F] text-[#8892B0] hover:text-white"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setActiveTab("sell")}
                      className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === "sell"
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                          : "bg-[#0A192F] text-[#8892B0] hover:text-white"
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-[#8892B0] mb-1 block">Amount (SOL)</label>
                      <input
                        type="number"
                        value={activeTab === "buy" ? buyAmount : sellAmount}
                        onChange={(e) =>
                          activeTab === "buy"
                            ? setBuyAmount(e.target.value)
                            : setSellAmount(e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl bg-[#0A192F] border border-[#233554] text-white focus:outline-none focus:border-[#64FFDA] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#8892B0] mb-1 block">You get</label>
                      <div className="w-full px-4 py-3 rounded-xl bg-[#0A192F] border border-[#233554] text-[#64FFDA] font-medium">
                        ~{parseFloat(activeTab === "buy" ? buyAmount || "0" : sellAmount || "0") * selectedToken.price} {selectedToken.symbol}
                      </div>
                    </div>
                    <button
                      disabled={!connected}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        activeTab === "buy"
                          ? "bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] text-[#0A192F] hover:shadow-lg hover:shadow-[#64FFDA]/30"
                          : "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/30"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {!connected
                        ? "Connect Wallet"
                        : activeTab === "buy"
                        ? `Buy ${selectedToken.symbol}`
                        : `Sell ${selectedToken.symbol}`}
                    </button>
                  </div>
                </div>

                <div className="bg-[#112240] rounded-2xl border border-[#233554] p-4">
                  <h3 className="font-semibold text-white mb-3">Token Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8892B0]">Liquidity</span>
                      <span className="text-white">{formatNumber(selectedToken.liquidity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8892B0]">Market Cap</span>
                      <span className="text-white">{formatNumber(selectedToken.marketCap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8892B0]">24h Volume</span>
                      <span className="text-white">{formatNumber(selectedToken.volume24h)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8892B0]">Age</span>
                      <span className="text-white">{selectedToken.age}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#112240] rounded-2xl border border-[#233554] p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#1A365D] flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-[#8892B0]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a Token</h3>
                <p className="text-sm text-[#8892B0]">Choose a token from the list to start trading</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}