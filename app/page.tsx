"use client";

import { useEffect, useState } from "react";
import HeroSection from "./components/HeroSection";
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
    <div className="relative z-10">
      <HeroSection />
      <WhyBluPrint />
      <HowItWorks />
      <TrustSection />
      <Footer />
    </div>
  );
}