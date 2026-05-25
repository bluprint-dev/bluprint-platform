"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Rocket, TrendingUp, Shield, Star, Crown, Award } from "lucide-react";

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
    <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-[#0A192F] to-[#020C1A]">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#64FFDA]/30 bg-[#1A365D]/20 px-4 py-1.5 text-sm font-medium text-[#64FFDA] backdrop-blur-sm">
            <Crown className="h-3.5 w-3.5" />
            <span>Whale Boost Program</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Get More{" "}
            <span className="bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] bg-clip-text text-transparent">
              Visibility
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-[#8892B0]">
            Boost your token to reach more traders and increase your launch success rate
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Premium Kart - Whale Tier */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="group relative rounded-2xl border border-[#64FFDA]/30 bg-gradient-to-br from-[#112240] to-[#0A192F] p-6 transition-all duration-300 hover:border-[#64FFDA] hover:shadow-xl hover:shadow-[#64FFDA]/20"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#64FFDA]/0 via-[#4ECDC4]/0 to-[#64FFDA]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#64FFDA] to-[#4ECDC4] shadow-lg shadow-[#64FFDA]/25">
              <Crown className="h-6 w-6 text-[#0A192F]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Whale Tier</h3>
            <p className="mb-4 text-[#8892B0]">Featured position + priority support + marketing package</p>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#64FFDA]">10 SOL</span>
              <span className="text-sm text-[#8892B0]">/week</span>
            </div>
            <button className="mt-2 w-full rounded-xl border border-[#64FFDA]/30 bg-[#1A365D]/30 px-4 py-2 font-medium text-white transition-all duration-200 hover:border-[#64FFDA] hover:bg-[#1A365D] hover:shadow-[0_0_15px_rgba(100,255,218,0.3)]">
              Select Plan
            </button>
          </motion.div>

          {/* Standard Kart */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="group relative rounded-2xl border border-[#233554] bg-[#112240] p-6 transition-all duration-300 hover:border-[#64FFDA]/50 hover:shadow-xl hover:shadow-[#64FFDA]/10"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D]">
              <TrendingUp className="h-6 w-6 text-[#64FFDA]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Standard Boost</h3>
            <p className="mb-4 text-[#8892B0]">Increased visibility in token listings and category pages</p>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#64FFDA]">2 SOL</span>
              <span className="text-sm text-[#8892B0]">/week</span>
            </div>
            <button className="mt-2 w-full rounded-xl border border-[#233554] bg-[#1A365D]/30 px-4 py-2 font-medium text-white transition-all duration-200 hover:border-[#64FFDA]/50 hover:bg-[#1A365D]">
              Select Plan
            </button>
          </motion.div>

          {/* Featured Boost - Token Selector */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-2xl border border-[#233554] bg-[#112240] p-6 transition-all duration-300 hover:border-[#64FFDA]/50 hover:shadow-xl hover:shadow-[#64FFDA]/10"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D]">
              <Star className="h-6 w-6 text-[#64FFDA]" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Featured Boost</h3>
            <p className="mb-4 text-[#8892B0]">Become the featured token of the day with premium placement</p>

            {/* Select Token Butonu */}
            <div className="relative mb-4">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-[#233554] bg-[#1A365D]/30 px-4 py-2.5 text-white transition-all duration-200 hover:border-[#64FFDA]/50 hover:bg-[#1A365D]"
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
                    className="absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border border-[#233554] bg-[#0A192F] shadow-xl"
                  >
                    <div className="grid grid-cols-2 divide-y divide-[#233554] md:block">
                      {availableTokens.map((token) => (
                        <button
                          key={token.address}
                          onClick={() => handleSelectToken(token)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-white transition-all duration-150 hover:bg-[#1A365D]/50"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1A365D] to-[#0A192F] border border-[#64FFDA]/30" />
                          <div>
                            <div className="font-semibold">{token.symbol}</div>
                            <div className="text-xs text-[#8892B0]">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="w-full rounded-xl bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] px-4 py-2 font-semibold text-[#0A192F] transition-all duration-200 hover:shadow-[0_0_20px_rgba(100,255,218,0.5)]">
              Boost Now
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}