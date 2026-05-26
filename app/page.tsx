"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Rocket, ArrowRight, Zap, Shield, Crown } from "lucide-react";

// ========== 1. ROTATING TOKEN CORE (TEK GÖRSEL) ==========
const TokenCore = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: y * 15, y: x * 15 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotation({ x: 0, y: 0 })}
    >
      {/* Ana cam küre */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-white/2 to-transparent"
        style={{ rotateX: rotation.x, rotateY: rotation.y }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        {/* İç enerji akışı */}
        <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-[#ff2d95]/20 to-[#ff6bcb]/10 blur-xl" />
        
        {/* Dönen halkalar */}
        <motion.div
          className="absolute inset-[-10%] rounded-full border border-[#ff2d95]/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[-20%] rounded-full border border-[#ff6bcb]/15"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Cam efekti */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(255,45,149,0.2)]" />
        
        {/* Merkez parıltı */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 blur-md" />
      </motion.div>
    </div>
  );
};

// ========== 2. CINEMATIC BUTTON (SADE) ==========
const PrimaryButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      className="relative px-8 py-4 rounded-full bg-white text-black font-semibold text-base overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb]"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <span className="relative flex items-center gap-2 z-10">
        {children}
        <motion.div animate={{ x: isHovered ? 4 : 0 }}>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </span>
    </motion.button>
  );
};

// ========== 3. SECONDARY BUTTON ==========
const SecondaryButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      className="relative px-8 py-4 rounded-full border border-white/10 text-white font-medium text-base overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 bg-white/5"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <span className="relative flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

// ========== 4. FEATURE CARD (MINIMAL) ==========
const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any; title: string; description: string; color: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative group cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
    >
      <div className="relative bg-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/5">
        <Icon className="w-6 h-6 mb-4" style={{ color }} />
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        
        {/* Hover glow - subtle */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff2d95]/5 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
};

// ========== MAIN HOMEPAGE ==========
export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();

  const handleCreate = () => {
    if (!connected) {
      // Trigger wallet connect
      const event = new CustomEvent('wallet-connect-requested');
      window.dispatchEvent(event);
      return;
    }
    router.push("/create");
  };

  const handleExplore = () => {
    router.push("/dex");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0F]">
      
      {/* Ana içerik - max genişlik ve padding ile kontrollü */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 min-h-screen flex flex-col">
        
        {/* HERO SECTION - Sol text, sağ görsel */}
        <div className="grid md:grid-cols-2 gap-12 items-center flex-1">
          
          {/* Sol taraf - Text ve CTA */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-white">
                  Launch Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] bg-clip-text text-transparent">
                  Meme Coin
                </span>
                <br />
                <span className="text-white">
                  in Seconds
                </span>
              </h1>
              
              <p className="text-gray-500 text-lg mt-6 max-w-md">
                No code. No friction. Just launch on Solana.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-8">
                <PrimaryButton onClick={handleCreate}>
                  <Rocket className="w-4 h-4" />
                  Create Token
                </PrimaryButton>
                <SecondaryButton onClick={handleExplore}>
                  Explore
                </SecondaryButton>
              </div>
            </motion.div>
          </div>
          
          {/* Sağ taraf - Tek güçlü görsel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center"
          >
            <TokenCore />
          </motion.div>
        </div>
        
        {/* FEATURE CARDS - 3 adet, minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-24 md:mt-32"
        >
          <FeatureCard
            icon={Zap}
            title="Instant Launch"
            description="Create and launch your token in seconds. No coding required."
            color="#ff2d95"
          />
          <FeatureCard
            icon={Shield}
            title="Bonding Curve"
            description="Fair price discovery. Price increases with every buy."
            color="#ff6bcb"
          />
          <FeatureCard
            icon={Crown}
            title="Zero Platform Fees"
            description="Only Solana network gas fee. No hidden costs."
            color="#7c3aed"
          />
        </motion.div>
        
        {/* Footer - minimal */}
        <div className="mt-24 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
          <p>© 2024 BluPrint — Built on Solana</p>
        </div>
      </div>
    </div>
  );
}