"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Rocket, ArrowRight, Upload, Check, RefreshCw, ArrowDownUp } from "lucide-react";

// ========== BONDING CURVE SIMULATION ==========
const BondingCurveSimulation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [progress, setProgress] = useState(0);
  const particlesRef = useRef<{ x: number; y: number; progress: number; active: boolean }[]>([]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: 0,
        y: 0,
        progress: Math.random(),
        active: Math.random() > 0.7,
      });
    }

    const getY = (x: number, mouseInfluence: number) => {
      // Bonding curve formula: y = x^2 / (x + 1) style
      const t = x;
      let y = Math.pow(t, 1.2) / (t + 0.5);
      // Mouse influence
      y += mouseInfluence * 0.08 * Math.sin(t * Math.PI);
      return y;
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const padding = 60;
      const curveWidth = w - padding * 2;
      
      // Clear with fade effect
      ctx.fillStyle = "rgba(10, 10, 15, 0.15)";
      ctx.fillRect(0, 0, w, h);
      
      // Update progress (slowly increases then resets)
      setProgress(prev => {
        let newVal = prev + 0.002;
        if (newVal > 1) newVal = 0;
        return newVal;
      });

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const x = padding + (curveWidth * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, h - padding);
        ctx.stroke();
        
        const y = padding + ((h - padding * 2) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }
      
      // Draw curve with gradient
      const gradient = ctx.createLinearGradient(padding, 0, w - padding, 0);
      gradient.addColorStop(0, "#ff2d95");
      gradient.addColorStop(0.5, "#ff6bcb");
      gradient.addColorStop(1, "#7c3aed");
      
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      
      let first = true;
      for (let x = 0; x <= 1; x += 0.01) {
        const y = getY(x, mousePosition.x - 0.5);
        const px = padding + x * curveWidth;
        const py = h - padding - y * (h - padding * 2);
        
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      
      // Draw glow behind curve
      ctx.beginPath();
      first = true;
      for (let x = 0; x <= 1; x += 0.01) {
        const y = getY(x, mousePosition.x - 0.5);
        const px = padding + x * curveWidth;
        const py = h - padding - y * (h - padding * 2);
        
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.lineWidth = 15;
      ctx.strokeStyle = "rgba(255,45,149,0.1)";
      ctx.stroke();
      
      // Draw progress point
      const currentX = padding + progress * curveWidth;
      const currentY = h - padding - getY(progress, mousePosition.x - 0.5) * (h - padding * 2);
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff2d95";
      ctx.fillStyle = "#ff2d95";
      ctx.beginPath();
      ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw price points
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const x = padding + t * curveWidth;
        const y = h - padding - getY(t, mousePosition.x - 0.5) * (h - padding * 2);
        
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Animate particles along curve
      for (let p of particlesRef.current) {
        if (p.active) {
          p.progress += 0.003;
          if (p.progress > 1) {
            p.progress = 0;
            p.active = Math.random() > 0.3;
          }
          
          const x = padding + p.progress * curveWidth;
          const y = h - padding - getY(p.progress, mousePosition.x - 0.5) * (h - padding * 2);
          
          ctx.fillStyle = `rgba(255, 100, 200, ${0.6 + Math.sin(time + p.progress * 10) * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, 2 + Math.sin(time * 5 + p.progress * 20) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      time += 0.02;
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [mousePosition]);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] md:h-[500px]"
      onMouseMove={handleMouseMove}
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
    </div>
  );
};

// ========== FLOATING UI CARDS ==========
const FloatingCards = () => {
  const cards = [
    {
      icon: Upload,
      title: "Token Creation",
      steps: ["Name", "Symbol", "Logo"],
      color: "#ff2d95",
      x: "5%",
      y: "15%",
      delay: 0,
    },
    {
      icon: ArrowDownUp,
      title: "Swap Simulation",
      steps: ["SOL → Token", "Token → SOL"],
      color: "#ff6bcb",
      x: "80%",
      y: "25%",
      delay: 0.5,
    },
    {
      icon: RefreshCw,
      title: "Launch Animation",
      steps: ["Deploying", "Confirming", "Live"],
      color: "#7c3aed",
      x: "90%",
      y: "70%",
      delay: 1,
    },
  ];
  
  return (
    <>
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:block z-20"
          style={{ left: card.x, top: card.y }}
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: [0.7, 1, 0.7],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: card.delay,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.05, zIndex: 30 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#ff2d95]/10 blur-xl rounded-2xl" />
            <div className="relative bg-[#1A1A22]/80 backdrop-blur-sm rounded-2xl p-4 border border-white/10 w-48">
              <card.icon className="w-5 h-5 mb-3" style={{ color: card.color }} />
              <p className="text-white text-sm font-medium mb-2">{card.title}</p>
              <div className="space-y-1">
                {card.steps.map((step, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span className="text-xs text-gray-500">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
};

// ========== CINEMATIC BUTTONS ==========
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
      <span className="relative">{children}</span>
    </motion.button>
  );
};

// ========== MAIN HOMEPAGE ==========
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
  
  const handleExplore = () => {
    router.push("/dex");
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0F]">
      
      {/* Floating UI Cards */}
      <FloatingCards />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        
        {/* Hero Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Text */}
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
                in Seconds ⚡
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
          
          {/* Right Side - Bonding Curve Simulation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d95]/5 via-[#ff6bcb]/5 to-[#7c3aed]/5 rounded-3xl blur-2xl" />
            <div className="relative bg-[#1A1A22]/20 backdrop-blur-sm rounded-3xl p-4 border border-white/5">
              <BondingCurveSimulation />
            </div>
          </motion.div>
        </div>
        
        {/* Footer */}
        <div className="mt-32 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
          <p>© 2024 BluPrint — Built on Solana</p>
        </div>
      </div>
    </div>
  );
}