"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BoostedToken {
  mint: string;
  symbol: string;
  name: string;
  image?: string;
  boostCount: number;
  expiresAt: number;
}

export default function MarqueeBanner() {
  const [tokens, setTokens] = useState<BoostedToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBoosts();
    const interval = setInterval(fetchActiveBoosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBoosts = async () => {
    try {
      const res = await fetch('/api/boost/active');
      const data = await res.json();
      if (data.success && data.tokens && data.tokens.length > 0) {
        setTokens(data.tokens);
      } else {
        setTokens([]);
      }
    } catch (err) {
      console.error('Banner fetch error:', err);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = (expiresAt: number): string => {
    const diff = expiresAt - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (86400000)) / 3600000);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "expiring";
  };

  // Loading sırasında gösterme
  if (loading) return null;

  // BOOST YOKSA - REKLAM METNİ GÖSTER
  if (tokens.length === 0) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 border-y border-purple-500/30 py-2">
        <div className="relative overflow-hidden whitespace-nowrap">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            className="inline-flex items-center gap-4"
          >
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="inline-flex items-center gap-2 px-4 py-1">
                <span className="text-yellow-400 text-sm">🚀</span>
                <span className="text-white text-sm font-medium">
                  Boost your token — get 4 days of global banner visibility!
                </span>
                <span className="text-purple-400 text-sm">✨</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // BOOST VARSA - TOKEN LİSTESİNİ GÖSTER
  const marqueeItems = [...tokens, ...tokens, ...tokens];

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-y border-yellow-500/30 py-1.5">
      <div className="relative overflow-hidden whitespace-nowrap">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          className="inline-flex items-center gap-2"
        >
          {marqueeItems.map((token, idx) => (
            <button
              key={`${token.mint}-${idx}`}
              onClick={() => window.open(`https://solscan.io/token/${token.mint}`, "_blank")}
              className="group flex items-center gap-2 px-3 py-1 bg-gray-800/80 rounded-full border border-yellow-500/40 hover:border-yellow-500 hover:bg-gray-800 transition-all duration-200"
            >
              {token.image ? (
                <img src={token.image} alt={token.symbol} className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-[10px]">
                  🚀
                </div>
              )}
              
              <span className="text-sm font-semibold text-white">{token.symbol}</span>
              
              <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                🔥 {token.boostCount}
              </span>
              
              <span className="text-[10px] text-gray-400 hidden sm:inline">
                {getRemainingTime(token.expiresAt)}
              </span>
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}