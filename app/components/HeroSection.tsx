"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onCreateClick?: () => void;
}

export default function HeroSection({ onCreateClick }: HeroSectionProps) {
  return (
    <section className="px-4 pt-20 pb-16 md:pt-28 md:pb-20 lg:pt-32">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4">
            Launch Your Meme Coin
            <br />
            in{" "}
            <span className="text-[oklch(51.8%_0.253_323.949)]">
              Seconds
            </span>
          </h1>

          <p className="text-[#8A8A99] text-base sm:text-lg max-w-2xl mx-auto mb-8">
            No code. No friction. Just launch like a whale.
          </p>

          {onCreateClick ? (
            <button
              onClick={onCreateClick}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[oklch(51.8%_0.253_323.949)] text-white font-semibold hover:opacity-90 transition-all"
            >
              Create Token
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[oklch(51.8%_0.253_323.949)] text-white font-semibold hover:opacity-90 transition-all"
            >
              Create Token
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div>
              <div className="text-2xl font-bold text-white">$50M+</div>
              <div className="text-xs text-[#8A8A99]">Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-xs text-[#8A8A99]">Tokens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100K+</div>
              <div className="text-xs text-[#8A8A99]">Traders</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}