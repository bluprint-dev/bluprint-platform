"use client";

import Link from "next/link";
import { Flame, RefreshCw, Activity } from "lucide-react";
import { motion } from "framer-motion";

type DexHeaderProps = {
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export default function DexHeader({ onRefresh, isRefreshing }: DexHeaderProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0F]/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#ff2d95]/30 blur-lg" />
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#ff6bcb] flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">BluPrint DEX</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400/50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                  </span>
                  Live
                </span>
                <span className="text-gray-700">·</span>
                <span className="inline-flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#ff2d95]" />
                  Bonding Curve
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white text-sm font-semibold shadow-[0_0_30px_rgba(255,45,149,0.18)] hover:shadow-[0_0_45px_rgba(255,45,149,0.28)] transition"
            >
              Launch token
              <span className="text-white/80 text-xs font-mono">/create</span>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-[#ff2d95]/40 hover:shadow-[0_0_30px_rgba(255,45,149,0.12)] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-sm hidden sm:inline">Refresh</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
