"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Flame, TrendingUp, Rocket } from "lucide-react";

interface MarqueeBannerProps {
  tokens?: Array<{ symbol: string; priceChange: number }>;
}

export default function MarqueeBanner({ tokens = [] }: MarqueeBannerProps) {
  const [isBoostActive, setIsBoostActive] = useState(false);

  useEffect(() => {
    // Boost kontrolü - gerçek API'den gelecek
    const checkBoost = async () => {
      // Simülasyon
      setIsBoostActive(false);
    };
    checkBoost();
  }, []);

  // Varsayılan token verileri
  const defaultTokens = [
    { symbol: "BONK", priceChange: 15.4 },
    { symbol: "WIF", priceChange: 8.2 },
    { symbol: "POPCAT", priceChange: 22.1 },
    { symbol: "MEW", priceChange: -3.5 },
    { symbol: "SAMO", priceChange: 5.7 },
  ];

  const displayTokens = tokens.length > 0 ? tokens : defaultTokens;

  const bannerContent = [
    ...displayTokens.map(
      (token) => (
        <div
          key={token.symbol}
          className="flex items-center gap-2 rounded-full bg-gray-800/50 px-4 py-1.5 backdrop-blur-sm"
        >
          <span className="font-semibold text-white">{token.symbol}</span>
          <span
            className={`flex items-center gap-1 text-sm font-medium ${
              token.priceChange >= 0 ? "text-green-400" : "text-red-400"
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
    // Boost mesajı - DAHA DİKKAT ÇEKİCİ (sadece boost yoksa göster)
    ...(!isBoostActive
      ? [
          <div
            key="boost-message"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-5 py-1.5 backdrop-blur-sm"
          >
            <Rocket className="h-4 w-4 text-purple-400" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-bold text-transparent">
              BOOST YOUR TOKEN
            </span>
            <Flame className="h-3.5 w-3.5 text-orange-400" />
          </div>,
        ]
      : []),
  ];

  // Banner yüksekliği azaltıldı (py-3 → py-1.5)
  return (
    <div className="relative overflow-hidden border-y border-gray-800/50 bg-gray-950/50 py-1.5 backdrop-blur-sm">
      <div className="flex items-center">
        <div className="absolute left-0 z-10 h-full w-20 bg-gradient-to-r from-gray-950 to-transparent" />
        <div className="absolute right-0 z-10 h-full w-20 bg-gradient-to-l from-gray-950 to-transparent" />

        <motion.div
          className="flex gap-6 whitespace-nowrap px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 35, // 30s → 35s yavaşlatıldı
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* İçeriği iki kez tekrarla (sonsuz kayma için) */}
          {[...bannerContent, ...bannerContent].map((content, index) => (
            <div key={index}>{content}</div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}