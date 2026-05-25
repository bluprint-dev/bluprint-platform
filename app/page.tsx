"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useI18n } from "./lib/i18n-provider";
import HeroSection from "./components/HeroSection";
import MarqueeBanner from "./components/MarqueeBanner";
import WhyBluPrint from "./components/WhyBluPrint";
import HowItWorks from "./components/HowItWorks";
import TrustSection from "./components/TrustSection";
import UseCase from "./components/UseCase";
import BoostSection from "./components/BoostSection";
import LiveExperience from "./components/LiveExperience";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

export default function Home() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateClick = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A192F]">
      <main>
        <MarqueeBanner />
        <HeroSection onCreateClick={handleCreateClick} />
        
        <div className="max-w-7xl mx-auto px-4">
          {/* PREMIUM FEATURE CARDS SECTION */}
          <div className="relative py-12 mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-[#64FFDA]/5 via-transparent to-[#64FFDA]/5 rounded-3xl" />
            <div className="relative z-10">
              <WhyBluPrint t={t} />
              <HowItWorks t={t} />
              <LiveExperience t={t} />
              <TrustSection t={t} />
              <UseCase t={t} />
              <BoostSection t={t} />
              <div ref={formRef}>
                <FinalCTA onScrollToForm={handleCreateClick} t={t} />
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </main>
    </div>
  );
}