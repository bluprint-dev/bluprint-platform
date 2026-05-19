
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  tokensLeft: number;
}

export default function CountdownTimer({ tokensLeft }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Eğer token kalmadıysa timer'ı durdur
    if (tokensLeft <= 0) {
      setIsActive(false);
      return;
    }

    // Hedef tarih: 7 gün sonra (veya tokenlar bitene kadar)
    // İlk 100 token için 7 günlük süre
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    targetDate.setHours(23, 59, 59, 999);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0 || tokensLeft <= 0) {
        setIsActive(false);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [tokensLeft]);

  if (!isActive || tokensLeft <= 0) {
    return (
      <div className="text-center py-2 px-4 bg-red-100 dark:bg-red-900/30 rounded-full">
        <span className="text-red-600 dark:text-red-400 font-semibold">
          ⭐ FIRST 100 OFFER ENDED ⭐
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full py-2 px-4 shadow-lg"
    >
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">🎁 FIRST 100 OFFER</span>
          <span className="text-white/80 text-xs">{tokensLeft} spots left</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="bg-white/20 backdrop-blur rounded-lg px-2 py-1 min-w-[50px] text-center">
            <div className="text-white font-mono font-bold text-lg">
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
            <div className="text-white/70 text-[10px]">HOURS</div>
          </div>
          <span className="text-white text-xl font-bold">:</span>
          <div className="bg-white/20 backdrop-blur rounded-lg px-2 py-1 min-w-[50px] text-center">
            <div className="text-white font-mono font-bold text-lg">
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
            <div className="text-white/70 text-[10px]">MINS</div>
          </div>
          <span className="text-white text-xl font-bold">:</span>
          <div className="bg-white/20 backdrop-blur rounded-lg px-2 py-1 min-w-[50px] text-center">
            <div className="text-white font-mono font-bold text-lg">
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
            <div className="text-white/70 text-[10px]">SECS</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-yellow-200 text-sm">⚡</span>
          <span className="text-white text-xs font-semibold">0.15 SOL</span>
          <span className="text-yellow-200 text-sm">⚡</span>
        </div>
      </div>
    </motion.div>
  );
}