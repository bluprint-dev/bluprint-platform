"use client";

import { useEffect, useRef } from "react";

const MARQUEE_MESSAGE = `
🚀 BLUPRINT.FUN IS LIVE! • 💰 TOTAL FEE ONLY %0.95 — LOWEST IN THE GAME! • 💎 FIRST 100 USERS MINT FOR JUST 0.05 SOL! • 📈 ADVANCED BONDING CURVE & METAPLEX GENESIS INTEGRATION • 🔄 INNER SWAP ACTIVE — NO THIRD PARTY DEX NEEDED! • 👑 INVITE FRIENDS & EARN 0.05 SOL INSTANTLY! • 🏆 RECRUIT 1000 REFERRALS TO CLAIM +10 SOL EXTRA ACCELERATED BONUS & UNLOCK THE ULTRA-EXCLUSIVE VIP FEATURE! • 🚀 BLUPRINT.FUN IS LIVE!
`;

export default function MarqueeBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const speed = 1;

    const animate = () => {
      if (!scrollContainer) return;
      scrollAmount += speed;
      scrollContainer.scrollLeft = scrollAmount;
      if (scrollAmount >= scrollContainer.scrollWidth) {
        scrollAmount = 0;
      }
      requestAnimationFrame(animate);
    };

    const animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, []);

  return (
    <div
      className="w-full bg-transparent overflow-hidden whitespace-nowrap py-3 border-y border-transparent/30 select-none"
    >
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-none gap-8 whitespace-nowrap"
        style={{
          scrollBehavior: "auto",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          background: "transparent",
        }}
      >
        <div className="flex items-center gap-8 pl-24">
          <div
            className="inline-block font-mono text-sm font-bold tracking-wider text-[#34C759]" // Solana yeşili
            style={{
              textShadow: "0 0 10px rgba(52, 199, 89, 0.5)",
              background: "linear-gradient(to right, rgba(52, 199, 89, 0.1), rgba(52, 199, 89, 0.5), rgba(52, 199, 89, 0.1))",
            }}
          >
            {MARQUEE_MESSAGE.repeat(2)}
          </div>
          <div
            className="inline-block font-mono text-sm font-bold tracking-wider text-[#7E5AF7]" // Solana moru
            style={{
              textShadow: "0 0 10px rgba(126, 90, 247, 0.5)",
              background: "linear-gradient(to right, rgba(126, 90, 247, 0.1), rgba(126, 90, 247, 0.5), rgba(126, 90, 247, 0.1))",
            }}
          >
            {MARQUEE_MESSAGE.repeat(2)}
          </div>
        </div>
      </div>
    </div>
  );
}