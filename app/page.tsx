"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, useInView } from "framer-motion";
import { 
  Rocket, Zap, Shield, Crown, Infinity, Coins, 
  Activity, Users, TrendingUp, Sparkles, Check, ArrowDown, ArrowUp
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();

  const handleCreate = () => {
    if (!connected) {
      const event = new CustomEvent('wallet-connect-requested');
      window.dispatchEvent(event);
      return;
    }
    router.push("/create");
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0F]">
      
      {/* HERO SECTION */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              <span className="text-white">
                Launch Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] bg-clip-text text-transparent">
                Meme Coin
              </span>
              <br />
              <span className="text-white">
                in Seconds ⚡
              </span>
            </h1>
            
            <p className="text-gray-500 text-lg md:text-xl mt-6 max-w-2xl mx-auto">
              No code. No friction. Just launch on Solana.
            </p>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onClick={handleCreate}
              className="mt-10 px-8 py-4 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-bold text-lg cursor-pointer hover:shadow-lg hover:shadow-[#ff2d95]/30 transition-all duration-300 hover:scale-105"
            >
              <Rocket className="w-5 h-5 inline mr-2" />
              Create Token
            </motion.button>
          </motion.div>
        </div>
      </section>
      
      {/* SECTION 1 - ABOUT */}
      <Section>
        <div className="text-center max-w-4xl mx-auto">
          <SectionBadge icon={Sparkles} text="What is BluPrint?" color="#ff2d95" />
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            The Next Generation
            <br />
            <span className="bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] bg-clip-text text-transparent">
              Meme Coin Launchpad
            </span>
          </h2>
          
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            BluPrint is a fair-launch platform built on Solana that allows anyone to create and launch 
            their own meme coin in seconds using bonding curve technology. No coding required. No pre-sale. 
            No hidden fees. Just pure, decentralized token creation.
          </p>
        </div>
      </Section>
      
      {/* SECTION 2 - BUY/SELL */}
      <Section>
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <SectionBadge icon={Activity} text="Instant Trading" color="#ff6bcb" />
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Buy & Sell
                <br />
                <span className="text-[#ff6bcb]">Instantly</span>
              </h3>
              
              <p className="text-gray-400 text-lg mb-6">
                Thanks to bonding curve technology, your token becomes tradable immediately after launch.
                No need to wait for liquidity pools or external market makers.
              </p>
              
              <div className="space-y-3">
                {[
                  "Instant liquidity after creation",
                  "Fair price discovery algorithm",
                  "No order books needed",
                  "Automatic Raydium migration at 100% fill"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <SwapAnimation />
            </div>
          </div>
        </div>
      </Section>
      
      {/* SECTION 3 - FEATURES */}
      <Section>
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <SectionBadge icon={Crown} text="Why BluPrint?" color="#7c3aed" />
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Built for the <span className="text-[#7c3aed]">Community</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Launch in Seconds", description: "Create and deploy your token in under 10 seconds. No coding required.", color: "#ff2d95" },
              { icon: Shield, title: "Fair Launch", description: "No pre-sale, no team allocation, no rug pulls. Pure decentralized launch.", color: "#ff6bcb" },
              { icon: Coins, title: "Zero Platform Fees", description: "Only Solana network gas fee. No hidden platform charges.", color: "#7c3aed" },
              { icon: Infinity, title: "Bonding Curve", description: "Automatic price discovery. Price increases with every buy.", color: "#ff2d95" },
              { icon: Users, title: "Community Driven", description: "Built by creators, for creators. Fair for everyone.", color: "#ff6bcb" },
              { icon: TrendingUp, title: "Auto Raydium", description: "Automatically migrates to Raydium when curve fills 100%.", color: "#7c3aed" }
            ].map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </div>
      </Section>
      
      {/* SECTION 4 - FINAL CTA */}
      <Section>
        <div className="text-center max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-[#ff2d95]/10 to-[#ff6bcb]/10 rounded-3xl p-12 border border-[#ff2d95]/20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to Launch?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join thousands of creators who have already launched their meme coins on BluPrint.
            </p>
            <button
              onClick={handleCreate}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-bold text-lg cursor-pointer hover:shadow-lg hover:shadow-[#ff2d95]/30 transition-all duration-300 hover:scale-105"
            >
              <Rocket className="w-5 h-5 inline mr-2" />
              Create Token Now
            </button>
          </div>
        </div>
      </Section>
      
      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 text-sm border-t border-white/5">
        <p>© 2024 BluPrint — Built on Solana</p>
      </footer>
    </div>
  );
}

// ========== REUSABLE COMPONENTS ==========

const Section = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        {children}
      </motion.div>
    </section>
  );
};

const SectionBadge = ({ icon: Icon, text, color }: { icon: React.ElementType; text: string; color: string }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
    <Icon className="w-4 h-4" style={{ color }} />
    <span className="text-sm text-gray-300 font-medium">{text}</span>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, color, index }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  color: string; 
  index: number 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-[#ff2d95]/30 transition-all duration-300"
    >
      <Icon className="w-10 h-10 mb-4" style={{ color }} />
      <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </motion.div>
  );
};

// ========== BUY/SELL ANIMATION COMPONENT ==========
const SwapAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [swapDirection, setSwapDirection] = useState<"buy" | "sell">("buy");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setSwapDirection(prev => prev === "buy" ? "sell" : "buy");
      setTimeout(() => setIsAnimating(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative bg-[#1A1A22]/40 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
      
      {/* From Box */}
      <div className="bg-[#0A0A0F] rounded-xl p-4 mb-4 border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-sm">From</span>
          <span className="text-white font-mono text-sm">Balance: 1.234 SOL</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] flex items-center justify-center">
            <span className="text-white text-sm">◎</span>
          </div>
          <input 
            type="text" 
            value={swapDirection === "buy" ? "0.5" : "1000"}
            className="bg-transparent text-2xl font-bold text-white outline-none flex-1"
            readOnly
          />
          <span className="text-white font-medium">SOL</span>
        </div>
      </div>
      
      {/* Swap Arrow */}
      <div className="flex justify-center -my-2 relative z-10">
        <div className="w-10 h-10 rounded-full bg-[#1A1A22] border border-[#ff2d95]/30 flex items-center justify-center">
          {swapDirection === "buy" ? 
            <ArrowDown className="w-4 h-4 text-[#ff2d95]" /> : 
            <ArrowUp className="w-4 h-4 text-[#ff2d95]" />
          }
        </div>
      </div>
      
      {/* To Box */}
      <div className="bg-[#0A0A0F] rounded-xl p-4 mt-4 border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-sm">To</span>
          <span className="text-white font-mono text-sm">Balance: 0 PINK</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] flex items-center justify-center">
            <span className="text-white text-sm">🐋</span>
          </div>
          <input 
            type="text" 
            value={swapDirection === "buy" ? "2,340" : "0"}
            className="bg-transparent text-2xl font-bold text-white outline-none flex-1"
            readOnly
          />
          <span className="text-white font-medium">PINK</span>
        </div>
      </div>
      
      {/* Price info */}
      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <div className="flex justify-center items-center gap-4 text-sm">
          <span className="text-gray-500">Price</span>
          <span className="text-white font-mono">1 SOL = 4,680 PINK</span>
        </div>
      </div>
    </div>
  );
};