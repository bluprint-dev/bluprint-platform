"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onCreateClick?: () => void;
}

export default function HeroSection({ onCreateClick }: HeroSectionProps) {
  return (
    <section className="px-4 pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            Launch Your Meme Coin
            <br />
            in{" "}
            <span className="text-[oklch(51.8%_0.253_323.949)]">
              Seconds
            </span>
          </h1>
          <p className="text-[#8E8E93] text-lg md:text-xl max-w-2xl mx-auto mb-8">
            No code. No friction. Just launch.
          </p>
          <div>
            {onCreateClick ? (
              <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[oklch(51.8%_0.253_323.949)] text-white font-semibold text-lg hover:opacity-90 transition"
              >
                Create Token
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[oklch(51.8%_0.253_323.949)] text-white font-semibold text-lg hover:opacity-90 transition"
              >
                Create Token
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-[#8E8E93]">
            <div>
              <span className="text-white font-semibold text-xl">$50M+</span>
              <p>Volume</p>
            </div>
            <div>
              <span className="text-white font-semibold text-xl">500+</span>
              <p>Tokens</p>
            </div>
            <div>
              <span className="text-white font-semibold text-xl">100K+</span>
              <p>Traders</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}