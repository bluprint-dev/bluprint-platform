"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Crown, Rocket, ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA({ onScrollToForm, t }: { onScrollToForm: () => void; t: (key: string) => string }) {
  const [floatingIcons, setFloatingIcons] = useState<{ id: number; x: number; y: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const icons = [];
    for (let i = 0; i < 24; i++) {
      icons.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 10,
      });
    }
    setFloatingIcons(icons);
  }, []);

  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-[#0A192F] to-[#020C1A]">
      {/* Arkaplan efektleri */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#64FFDA]/5 to-transparent" />
      
      {/* Uçuşan ikonlar */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingIcons.map((icon) => (
          <motion.div
            key={icon.id}
            initial={{ 
              x: `${icon.x}%`, 
              y: `${icon.y}%`,
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              y: [`${icon.y}%`, `${icon.y - 30}%`, `${icon.y}%`],
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: icon.duration,
              delay: icon.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute"
            style={{ left: `${icon.x}%`, top: `${icon.y}%` }}
          >
            <Crown className="w-8 h-8 text-[#64FFDA]/20" />
          </motion.div>
        ))}
      </div>

      {/* Ana içerik */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Glow efekti */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#64FFDA]/10 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#64FFDA] to-white bg-clip-text text-transparent mb-4"
        >
          {t("cta_title")}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[#8892B0] text-base sm:text-lg mb-10 max-w-2xl mx-auto"
        >
          {t("cta_subtitle")}
        </motion.p>

        {/* Buton */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative inline-block"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
          
          <button
            onClick={onScrollToForm}
            className="relative px-10 py-4 bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] hover:from-[#4ECDC4] hover:to-[#64FFDA] rounded-2xl text-[#0A192F] font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-[#64FFDA]/50 flex items-center gap-3 group"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span>{t("cta_button")}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </motion.div>

        {/* Alt kısım */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center items-center gap-2 mt-12"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="w-8 h-8 rounded-full bg-[#1A365D]/50 backdrop-blur-sm border border-[#64FFDA]/30 flex items-center justify-center"
              >
                <Crown className="w-4 h-4 text-[#64FFDA]/60" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}