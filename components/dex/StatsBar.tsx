"use client";

import { Activity, Coins, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

type StatsBarProps = {
  totalTokens: number;
  isLoading?: boolean;
};

export default function StatsBar({ totalTokens, isLoading }: StatsBarProps) {
  const stats = [
    { icon: Coins, label: "Live Tokens", value: isLoading ? "—" : totalTokens.toString(), color: "#ff2d95" },
    { icon: TrendingUp, label: "Bonding Curve", value: "Active", color: "#ff6bcb" },
    { icon: Activity, label: "Network", value: "Solana", color: "#7c3aed" },
    { icon: Zap, label: "Trade", value: "Instant", color: "#22c55e" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-[#ff2d95]/20 transition"
        >
          <div
            className="absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition"
            style={{ backgroundColor: stat.color }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${stat.color}20` }}
            >
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-white font-bold">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
