"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, Rocket, Crown } from "lucide-react";

interface MarqueeBannerProps {
  tokens?: Array<{ symbol: string; priceChange: number }>;
}

export default function MarqueeBanner({ tokens = [] }: MarqueeBannerProps) {
  const [isBoostActive, setIsBoostActive] = useState(false);

  useEffect(() => {
    // Boost kontrolü - gerçek API'den gelecek
    setIsBoostActive(false);
  }, []);

  const defaultTokens = [
    { symbol: "WHALE", priceChange: 25.4 },
    { symbol: "SOL", priceChange: 12.2 },
    { symbol: "BONK", priceChange: 8.1 },
    { symbol: "WIF", priceChange: -2.5 },
    { symbol: "POPCAT", priceChange: 18.7 },
    { symbol: "MEW", priceChange: 5.3 },
  ];

  const displayTokens = tokens.length > 0 ? tokens : defaultTokens;

  const bannerContent = [
    ...displayTokens.map(
      (token) => (
        <div
          key={token.symbol}
          className="flex items-center gap-2 rounded-full bg-[#1A365D]/30 px-4 py-1.5 backdrop-blur-sm border border-[#233554]"
        >
          <span className="font-semibold text-white">{token.symbol}</span>
          <span
            className={`flex items-center gap-1 text-sm font-medium ${
              token.priceChange >= 0 ? "text-[#64FFDA]" : "text-red-400"
            }`}
          >
            {token.priceChange >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3 rotate-180" />
            )}
            {Math.abs(token.priceChange)}%
          </span>
        </div>
      )
    ),
    ...(!isBoostActive
      ? [
          <div
            key="boost-message"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#64FFDA]/20 to-[#4ECDC4]/20 px-5 py-1.5 backdrop-blur-sm border border-[#64FFDA]/30"
          >
            <Rocket className="h-4 w-4 text-[#64FFDA]" />
            <span className="bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] bg-clip-text font-bold text-transparent">
              WHALE BOOST ACTIVE
            </span>
            <Crown className="h-3.5 w-3.5 text-[#64FFDA]" />
          </div>,
        ]
      : []),
  ];

  return (
    <div className="relative overflow-hidden border-y border-[#233554] bg-[#020C1A]/80 py-1.5 backdrop-blur-sm">
      <div className="flex items-center">
        <div className="absolute left-0 z-10 h-full w-20 bg-gradient-to-r from-[#020C1A] to-transparent" />
        <div className="absolute right-0 z-10 h-full w-20 bg-gradient-to-l from-[#020C1A] to-transparent" />

        <motion.div
          className="flex gap-6 whitespace-nowrap px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[...bannerContent, ...bannerContent].map((content, index) => (
            <div key={index}>{content}</div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}