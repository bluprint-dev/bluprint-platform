"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";

interface HeroSectionProps {
  onCreateClick?: () => void;
}

export default function HeroSection({ onCreateClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
      {/* Arkaplan efekti */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#64FFDA]/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-[#1A365D]/20 blur-[80px]" />
      </div>

      <div className="container mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Sol taraf - Yazılar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#64FFDA]/30 bg-[#1A365D]/20 px-3 py-1 text-xs font-medium text-[#64FFDA] backdrop-blur-sm md:px-4 md:py-1.5 md:text-sm">
              <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span>Solana Whale Ecosystem</span>
            </div>

            {/* Ana başlık */}
            <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Launch Your
              <br />
              Meme Coin in
              <br />
              <span className="bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] bg-clip-text text-transparent">
                Seconds
              </span>
            </h1>

            {/* Alt başlık */}
            <p className="mx-auto mb-6 text-base text-[#8892B0] sm:text-lg md:text-xl lg:mx-0">
              No code. No friction. Just launch like a whale.
            </p>

            {/* Buton */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative inline-block"
            >
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] opacity-50 blur-lg transition duration-300 group-hover:opacity-100" />
              {onCreateClick ? (
                <button
                  onClick={onCreateClick}
                  className="relative flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] px-6 py-3 text-base font-semibold text-[#0A192F] transition-all duration-200 hover:shadow-[0_0_30px_rgba(100,255,218,0.3)] md:px-8 md:py-3.5 md:text-lg"
                >
                  Create Token
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 md:h-5 md:w-5" />
                </button>
              ) : (
                <Link
                  href="/create"
                  className="relative flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] px-6 py-3 text-base font-semibold text-[#0A192F] transition-all duration-200 hover:shadow-[0_0_30px_rgba(100,255,218,0.3)] md:px-8 md:py-3.5 md:text-lg"
                >
                  Create Token
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 md:h-5 md:w-5" />
                </Link>
              )}
            </motion.div>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <div className="text-center lg:text-left">
                <div className="text-xl font-bold text-white md:text-2xl">$50M+</div>
                <div className="text-[10px] text-[#8892B0] md:text-xs">Volume Launched</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl font-bold text-white md:text-2xl">500+</div>
                <div className="text-[10px] text-[#8892B0] md:text-xs">Tokens Created</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl font-bold text-white md:text-2xl">100K+</div>
                <div className="text-[10px] text-[#8892B0] md:text-xs">Active Traders</div>
              </div>
            </div>
          </motion.div>

          {/* Sağ taraf - Whale Mock-up */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-full"
          >
            <div className="group relative rounded-2xl border border-[#233554] bg-[#112240] p-2 shadow-2xl shadow-[#64FFDA]/10 backdrop-blur-sm transition-all duration-300 hover:border-[#64FFDA]/50 hover:shadow-[#64FFDA]/20">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#64FFDA] via-[#4ECDC4] to-[#64FFDA] opacity-20 blur-xl transition duration-300 group-hover:opacity-40" />
              <img
                src="/phantom-mockup.png"
                alt="Phantom Wallet Interface"
                className="w-full rounded-xl"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/600x400/112240/64FFDA?text=Whale+Wallet+Mockup";
                }}
              />
            </div>

            <div className="absolute -bottom-3 -left-3 rounded-full bg-[#1A365D]/50 p-2 backdrop-blur-sm border border-[#64FFDA]/30 md:-bottom-4 md:-left-4 md:p-3">
              <TrendingUp className="h-3 w-3 text-[#64FFDA] md:h-4 md:w-4" />
            </div>
            <div className="absolute -right-3 -top-3 rounded-full bg-[#1A365D]/50 p-2 backdrop-blur-sm border border-[#64FFDA]/30 md:-right-4 md:-top-4 md:p-3">
              <Shield className="h-3 w-3 text-[#64FFDA] md:h-4 md:w-4" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}