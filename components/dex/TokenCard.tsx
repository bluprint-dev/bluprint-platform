"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { DexToken } from "@/types/dex";
import { shortMint } from "@/lib/dex/normalizeToken";

type TokenCardProps = {
  token: DexToken;
  selected?: boolean;
  index?: number;
  onSelect: (token: DexToken) => void;
};

function TokenAvatar({ token }: { token: DexToken }) {
  if (token.imageUrl) {
    return (
      <img
        src={token.imageUrl}
        alt={token.symbol}
        className="w-11 h-11 rounded-full object-cover ring-2 ring-white/5"
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#7c3aed] flex items-center justify-center ring-2 ring-white/5">
      <span className="text-white font-bold text-lg">
        {token.symbol.charAt(0) || "?"}
      </span>
    </div>
  );
}

function TokenCardComponent({
  token,
  selected,
  index = 0,
  onSelect,
}: TokenCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(token)}
      className={`group relative w-full text-left flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all dex-card-hover ${
        selected
          ? "bg-[#ff2d95]/10 border-[#ff2d95]/40 shadow-[0_0_30px_rgba(255,45,149,0.15)]"
          : "bg-white/[0.02] border-white/5 hover:border-[#ff2d95]/25 hover:bg-white/[0.04]"
      }`}
    >
      {/* glow */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none ${
          selected ? "opacity-100" : ""
        }`}
        style={{
          background:
            "radial-gradient(700px circle at 10% 0%, rgba(255,45,149,0.12), transparent 45%)",
        }}
      />

      {/* left */}
      <div className="relative flex items-center gap-3 min-w-0">
        <TokenAvatar token={token} />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">
              {token.symbol}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {token.name}
            </span>
          </div>

          {/* ⚠️ still mint display ONLY (UI safe) */}
          <p className="text-xs text-gray-600 font-mono truncate">
            {shortMint(token.mint)}
          </p>
        </div>
      </div>

      {/* right */}
      <ChevronRight
        className={`relative w-4 h-4 shrink-0 transition ${
          selected
            ? "text-[#ff2d95]"
            : "text-gray-600 group-hover:text-gray-300"
        }`}
      />
    </motion.button>
  );
}

export default memo(TokenCardComponent);