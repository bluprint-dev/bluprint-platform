"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Rocket, TrendingUp, Shield, Star } from "lucide-react";

interface BoostSectionProps {
  t?: (key: string) => string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  logo?: string;
}

export default function BoostSection({ t }: BoostSectionProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Örnek token listesi
  const availableTokens: Token[] = [
    { address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", name: "USD Coin" },
    { address: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "Solana" },
    { address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "Bonk" },
    { address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", symbol: "WIF", name: "Dogwifhat" },
    { address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", symbol: "POPCAT", name: "Popcat" },
  ];

  const handleSelectToken = (token: Token) => {
    setSelectedToken(token);
    setIsDropdownOpen(false);
  };

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400">
            <Rocket className="h-3.5 w-3.5" />
            <span>{t ? t("boost_title") : "Boost Your Launch"}</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Get More <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Visibility</span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            {t ? t("boost_description") : "Boost your token to reach more traders and increase your launch success rate"}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Premium Kart - Border glow hover */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="group relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Premium Boost</h3>
            <p className="mb-4 text-gray-400">Featured position on homepage and trending section for 7 days</p>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">5 SOL</span>
              <span className="text-sm text-gray-500">/week</span>
            </div>
            <button className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 font-medium text-white transition-all duration-200 hover:border-purple-500 hover:bg-purple-500/20 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              Select Plan
            </button>
          </motion.div>

          {/* Standard Kart */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="group relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Standard Boost</h3>
            <p className="mb-4 text-gray-400">Increased visibility in token listings and category pages</p>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">2 SOL</span>
              <span className="text-sm text-gray-500">/week</span>
            </div>
            <button className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 font-medium text-white transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              Select Plan
            </button>
          </motion.div>

          {/* Kart 3: Token Selector */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Featured Boost</h3>
            <p className="mb-4 text-gray-400">Become the featured token of the day with premium placement</p>

            {/* Select Token Butonu - Geliştirilmiş hover efekti */}
            <div className="relative mb-4">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white transition-all duration-200 hover:border-cyan-500 hover:bg-cyan-500/20"
              >
                <span>{selectedToken ? selectedToken.symbol : (t ? t("select_token") : "Select a token")}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl"
                  >
                    {/* Mobil grid: 2 kolon, desktop: 1 kolon */}
                    <div className="grid grid-cols-2 divide-y divide-gray-800 md:block">
                      {availableTokens.map((token) => (
                        <button
                          key={token.address}
                          onClick={() => handleSelectToken(token)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-white transition-all duration-150 hover:bg-gray-800"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800" />
                          <div>
                            <div className="font-semibold">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-cyan-500/25">
              Boost Now
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}