"use client";

import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

export default function ReferralPage() {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col relative">

        {/* TAM BLUR + YAKINDA */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="relative w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[32px] bg-[#ff2d95]/10 blur-[60px]" />
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-10 text-center shadow-[0_0_60px_rgba(255,45,149,0.12)]">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-6xl mb-5">🔒</div>
              </motion.div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff2d95]/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff2d95]" />
                </span>
                Yakında
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-white">
                Referral Program
              </h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Referral sistemi şu anda bakımdadır. Yakında çok daha güçlü bir ödül altyapısıyla aktif edeceğiz.
              </p>

              <div className="mt-6">
                <a
                  href="/create"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white text-sm font-semibold shadow-[0_0_35px_rgba(255,45,149,0.22)] hover:shadow-[0_0_55px_rgba(255,45,149,0.32)] transition"
                >
                  Token oluştur
                </a>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>{false && <motion.div />}</AnimatePresence>

        <Footer />
      </div>
    </PageTransition>
  );
}