"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Terminal, Zap, CheckCircle } from "lucide-react";

export default function LiveExperience({ t }: { t: (key: string) => string }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setDisplayText(t("live_demo"));
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setDisplayText(t("live_success"));
        setSuccess(true);
        setTimeout(() => {
          setDisplayText(t("live_demo"));
          setSuccess(false);
          setIsAnimating(false);
        }, 2000);
      }, 1500);
    }, 6000);

    return () => clearInterval(interval);
  }, [t]);

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#64FFDA]/30 bg-[#1A365D]/20 px-4 py-1.5 text-sm font-medium text-[#64FFDA] backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5" />
            <span>Live Demo</span>
          </div>
          <motion.h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-[#64FFDA] bg-clip-text text-transparent">
            {t("live_title")}
          </motion.h2>
          <motion.p className="text-[#8892B0] mt-3">{t("live_subtitle")}</motion.p>
        </div>

        <motion.div className="max-w-2xl mx-auto">
          <div className="bg-[#020C1A] backdrop-blur-xl rounded-2xl border border-[#233554] p-6 shadow-xl shadow-[#64FFDA]/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <Terminal className="w-3 h-3 text-[#8892B0] ml-2" />
              <span className="text-xs text-[#8892B0] ml-1">bluprint-terminal</span>
            </div>

            <div className="font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#64FFDA]">$</span>
                <span className="text-white">create token --name "MyCoin" --symbol "MYC"</span>
              </div>
              <motion.div 
                animate={{ opacity: isAnimating ? [1, 0.5, 1] : 1 }} 
                transition={{ duration: 0.5 }} 
                className="mt-3"
              >
                <div className={`flex items-center gap-2 ${success ? 'text-[#64FFDA]' : 'text-[#4ECDC4]'}`}>
                  {success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  <span>{displayText}</span>
                </div>
              </motion.div>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mt-2 text-xs text-[#8892B0]"
                >
                  Transaction confirmed • Mint: B4uMev...NYgLzs
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}