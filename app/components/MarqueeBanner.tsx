"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MARQUEE_MESSAGES = [
  { id: 1, text: "✨ Create your own meme coin in seconds - No coding required", type: "info" },
  { id: 2, text: "💰 0% platform fees - Only Solana network gas fee", type: "info" },
  { id: 3, text: "🚀 Bonding curve launch - Price increases with every buy", type: "info" },
  { id: 4, text: "💎 Fair launch - No presale, no team allocation, no rug pulls", type: "info" },
  { id: 5, text: "⚡ Instant liquidity - Trade right after creation", type: "info" },
  { id: 6, text: "🌊 Auto Raydium migration - When curve reaches 100%", type: "info" },
  { id: 7, text: "🔄 Buy and sell any token instantly on bonding curve", type: "info" },
  { id: 8, text: "🎯 Transparent pricing - Virtual reserves algorithm", type: "info" },
  { id: 9, text: "🔒 Secure - Powered by Metaplex Genesis on Solana", type: "info" },
  { id: 10, text: "⏱️ 10 second token creation - Upload image, set name, launch", type: "info" },
  { id: 11, text: "📊 Track trending tokens - Real-time volume and price charts", type: "info" },
  { id: 12, text: "🏆 Top creators leaderboard - Most tokens launched", type: "info" },
  { id: 13, text: "💪 Built on Solana - Fast, cheap, scalable", type: "info" },
  { id: 14, text: "🎨 Customize your token - Name, symbol, image, description", type: "info" },
  { id: 15, text: "📈 Watch your token grow - From bonding curve to Raydium", type: "info" },
];

export default function MarqueeBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MARQUEE_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const currentMessage = MARQUEE_MESSAGES[currentIndex];

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-r from-[#ff2d95]/5 via-[#ff2d95]/10 to-[#ff2d95]/5 border-y border-[#ff2d95]/20 py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff2d95]/5 to-transparent animate-shimmer" />
      
      {/* Banner içeriği - sağa yaslı */}
      <div className="relative flex items-center justify-end gap-4 text-sm font-medium w-full px-6">
        
        {/* Sol taraf boş */}
        <div className="flex-1" />

        {/* Animated message - SAĞA YASLI */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-gray-200"
          >
            <span className="text-base">{currentMessage.text.split(" ")[0]}</span>
            <span>{currentMessage.text.substring(currentMessage.text.indexOf(" "))}</span>
          </motion.div>
        </AnimatePresence>

        {/* Live badge - sağda */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ff2d95]/10 border border-[#ff2d95]/20 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2d95] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff2d95]"></span>
          </span>
          <span className="text-[10px] font-mono text-[#ff2d95] tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
        {MARQUEE_MESSAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentIndex 
                ? "w-4 bg-[#ff2d95]" 
                : "w-1 bg-[#ff2d95]/30 hover:bg-[#ff2d95]/50"
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}