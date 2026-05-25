"use client";

import { useEffect, useState } from "react";
import HeroSection from "./components/HeroSection";
import MarqueeBanner from "./components/MarqueeBanner";
import WhyBluPrint from "./components/WhyBluPrint";
import HowItWorks from "./components/HowItWorks";
import TrustSection from "./components/TrustSection";
import Footer from "./components/Footer";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <HeroSection />
      <WhyBluPrint />
      <HowItWorks />
      <TrustSection />
      <Footer />
    </div>
  );
}