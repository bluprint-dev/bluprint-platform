"use client";

import { useEffect, useRef } from "react";

const MARQUEE_MESSAGES = [
  "✨ Create your own meme coin in seconds - No coding required",
  "💰 0% platform fees - Only Solana network gas fee",
  "🚀 Bonding curve launch - Price increases with every buy",
  "💎 Fair launch - No presale, no team allocation, no rug pulls",
  "⚡ Instant liquidity - Trade right after creation",
  "🌊 Auto Raydium migration - When curve reaches 100%",
  "🔄 Buy and sell any token instantly on bonding curve",
  "🎯 Transparent pricing - Virtual reserves algorithm",
  "🔒 Secure - Powered by Metaplex Genesis on Solana",
  "⏱️ 10 second token creation - Upload image, set name, launch",
  "📊 Track trending tokens - Real-time volume and price charts",
  "🏆 Top creators leaderboard - Most tokens launched",
  "💪 Built on Solana - Fast, cheap, scalable",
  "🎨 Customize your token - Name, symbol, image, description",
  "📈 Watch your token grow - From bonding curve to Raydium",
];

export default function MarqueeBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const speed = 1;
    const maxScroll = scrollContainer.scrollWidth / 2;

    const animate = () => {
      if (!scrollContainer) return;
      scrollAmount += speed;
      if (scrollAmount >= maxScroll) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
      requestAnimationFrame(animate);
    };

    const animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, []);

  // Duplicate messages for seamless loop
  const allMessages = [...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#ff2d95]/5 via-[#ff2d95]/10 to-[#ff2d95]/5 border-y border-[#ff2d95]/20 py-3">
      {/* Live badge - sol taraf sabit */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ff2d95]/20 border border-[#ff2d95]/30 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2d95] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff2d95]"></span>
        </span>
        <span className="text-[10px] font-mono text-[#ff2d95] font-bold tracking-wider">LIVE</span>
      </div>

      {/* Kayan içerik */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-none gap-8 whitespace-nowrap"
        style={{ scrollBehavior: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <div className="flex items-center gap-8 pl-24">
          {allMessages.map((message, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-gray-300 text-sm font-medium"
            >
              <span className="text-[#ff2d95]">◆</span>
              <span>{message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlay - sağ taraf */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0A0A0F] to-transparent pointer-events-none" />

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}