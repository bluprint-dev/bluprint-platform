"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Rocket, ArrowRight, Zap, Shield, Crown, Infinity, Coins, 
  Activity, Users, TrendingUp, Sparkles, Check, ArrowDown, ArrowUp
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const [scrollPhase, setScrollPhase] = useState(0);
  
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      if (value < 0.2) setScrollPhase(0);
      else if (value < 0.5) setScrollPhase(1);
      else if (value < 0.8) setScrollPhase(2);
      else setScrollPhase(3);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);
  
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);
  
  const handleCreate = () => {
    if (!connected) {
      const event = new CustomEvent('wallet-connect-requested');
      window.dispatchEvent(event);
      return;
    }
    router.push("/create");
  };
  
  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#0A0A0F]">
      
      {/* ========== HERO SECTION - Sabit ========== */}
      <motion.div 
        className="fixed inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ opacity, scale }}
      >
        <div className="text-center px-6 max-w-4xl mx-auto pointer-events-auto">
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
      </motion.div>
      
      {/* ========== SCROLL CONTENT ========== */}
      <div className="relative z-20 pt-[100vh]">
        
        {/* Section 1 - About BluPrint */}
        <div className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff2d95]/10 border border-[#ff2d95]/20 mb-8">
                <Sparkles className="w-4 h-4 text-[#ff2d95]" />
                <span className="text-sm text-[#ff2d95] font-medium">What is BluPrint?</span>
              </div>
              
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
            </motion.div>
          </div>
        </div>
        
        {/* Section 2 - Buy/Sell Animation */}
        <div className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Sol taraf - Açıklama */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff6bcb]/10 border border-[#ff6bcb]/20 mb-6">
                  <Activity className="w-4 h-4 text-[#ff6bcb]" />
                  <span className="text-sm text-[#ff6bcb] font-medium">Instant Trading</span>
                </div>
                
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
              </motion.div>
              
              {/* Sağ taraf - Buy/Sell Animation */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
              >
                <SwapAnimation />
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Section 3 - Features Grid */}
        <div className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="max-w-6xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 mb-6">
                <Crown className="w-4 h-4 text-[#7c3aed]" />
                <span className="text-sm text-[#7c3aed] font-medium">Why BluPrint?</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white">
                Built for the <span className="text-[#7c3aed]">Community</span>
              </h2>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Launch in Seconds",
                  description: "Create and deploy your token in under 10 seconds. No coding required.",
                  color: "#ff2d95"
                },
                {
                  icon: Shield,
                  title: "Fair Launch",
                  description: "No pre-sale, no team allocation, no rug pulls. Pure decentralized launch.",
                  color: "#ff6bcb"
                },
                {
                  icon: Coins,
                  title: "Zero Platform Fees",
                  description: "Only Solana network gas fee. No hidden platform charges.",
                  color: "#7c3aed"
                },
                {
                  icon: Infinity,
                  title: "Bonding Curve",
                  description: "Automatic price discovery. Price increases with every buy.",
                  color: "#ff2d95"
                },
                {
                  icon: Users,
                  title: "Community Driven",
                  description: "Built by creators, for creators. Fair for everyone.",
                  color: "#ff6bcb"
                },
                {
                  icon: TrendingUp,
                  title: "Auto Raydium",
                  description: "Automatically migrates to Raydium when curve fills 100%.",
                  color: "#7c3aed"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -5 }}
                  className="bg-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-[#ff2d95]/30 transition-all duration-300"
                >
                  <feature.icon className="w-10 h-10 mb-4" style={{ color: feature.color }} />
                  <h3 className="text-white font-bold text-xl mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Section 4 - Final CTA */}
        <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center max-w-3xl mx-auto"
          >
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
          </motion.div>
        </div>
        
        {/* Footer */}
        <div className="py-8 text-center text-gray-600 text-sm border-t border-white/5">
          <p>© 2024 BluPrint — Built on Solana</p>
        </div>
      </div>
    </div>
  );
}

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
        <motion.div
          animate={{ rotate: isAnimating ? (swapDirection === "buy" ? 180 : -180) : 0 }}
          transition={{ duration: 0.4, type: "spring" }}
          className="w-10 h-10 rounded-full bg-[#1A1A22] border border-[#ff2d95]/30 flex items-center justify-center"
        >
          {swapDirection === "buy" ? 
            <ArrowDown className="w-4 h-4 text-[#ff2d95]" /> : 
            <ArrowUp className="w-4 h-4 text-[#ff2d95]" />
          }
        </motion.div>
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
      
      {/* Animated particles */}
      <AnimatePresence>
        {isAnimating && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: swapDirection === "buy" ? "30%" : "70%",
                  y: "45%",
                  scale: 1,
                  opacity: 1
                }}
                animate={{ 
                  x: swapDirection === "buy" ? "70%" : "30%",
                  y: ["45%", "40%", "50%", "45%"],
                  scale: [1, 1.5, 0.5, 0],
                  opacity: [1, 0.8, 0.4, 0]
                }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="absolute w-2 h-2 rounded-full bg-[#ff2d95]"
                style={{ left: "50%", top: "50%" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      
      {/* Price info */}
      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <div className="flex justify-center items-center gap-4 text-sm">
          <span className="text-gray-500">Price</span>
          <span className="text-white font-mono">1 SOL = 4,680 PINK</span>
          <motion.div
            animate={{ scale: isAnimating ? 1.2 : 1 }}
            className="text-green-400 text-xs"
          >
            +2.3%
          </motion.div>
        </div>
      </div>
    </div>
  );
};