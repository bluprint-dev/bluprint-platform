"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-28 lg:py-32">
      {/* Gradient arkaplan efekti */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-500/20 blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Sol taraf - Yazılar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Solana Ecosystem</span>
            </div>

            {/* Ana başlık - FONT BÜYÜTÜLDÜ */}
            <h1 className="mb-6 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
              Launch Your
              <br />
              Meme Coin in
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Seconds
              </span>
            </h1>

            {/* Alt başlık - FONT BÜYÜTÜLDÜ */}
            <p className="mx-auto mb-8 text-xl text-gray-400 sm:text-2xl lg:mx-0">
              No code. No friction. Just launch.
            </p>

            {/* Buton - Gradient glow efekti eklendi */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative inline-block"
            >
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 opacity-75 blur-lg transition duration-300 group-hover:opacity-100" />
              <Link
                href="/create"
                className="relative flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] md:px-10 md:py-5 md:text-xl"
              >
                Create Token
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Sağ taraf - Phantom Mock-up */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-full"
          >
            <div className="relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-950/50 p-2 shadow-2xl shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-500/20">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-20 blur-xl transition duration-300 group-hover:opacity-40" />
              <img
                src="/phantom-mockup.png"
                alt="Phantom Wallet Interface"
                className="w-full rounded-xl"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/600x400/1a1a2e/3b82f6?text=Phantom+Wallet+Mockup";
                }}
              />
            </div>

            {/* Floating elementler */}
            <div className="absolute -bottom-4 -left-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-blue-400" />
            </div>
            <div className="absolute -right-4 -top-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-3 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}