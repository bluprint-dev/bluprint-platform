"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Rocket, Sparkles, Zap, Shield, Crown, Flame, Eye, ArrowRight, Github, Twitter, MessageCircle, Orbit, Globe, Compass, Coins, Activity } from "lucide-react";

// ========== 1. DEV 3D INTERACTIVE ORB ==========
const InteractiveOrb = () => {
  const orbRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [pulse, setPulse] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: y * 20, y: x * 20 });
  };

  const handleClick = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
  };

  return (
    <div 
      ref={orbRef}
      className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
      onClick={handleClick}
    >
      {/* Pulse wave on click */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-[#ff2d95]"
          />
        )}
      </AnimatePresence>

      {/* Orb layers */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff2d95] via-[#ff6bcb] to-[#7c3aed] opacity-20 blur-2xl"
        animate={{ scale: isHovered ? 1.2 : 1, opacity: isHovered ? 0.3 : 0.2 }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#ff6bcb]"
        style={{ rotateX: rotation.x, rotateY: rotation.y }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_rgba(255,45,149,0.5)]" />
        
        {/* Inner core */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/20 blur-md"
          animate={{ scale: isHovered ? 1.5 : 1 }}
        />
        
        {/* Particles around orb */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              top: `50%`,
              left: `50%`,
              transform: `rotate(${i * 30}deg) translateX(-${isHovered ? 140 : 120}px)`,
            }}
            animate={{ scale: isHovered ? 2 : 1, opacity: isHovered ? 0.8 : 0.4 }}
          />
        ))}
      </motion.div>
      
      {/* Energy rings */}
      <motion.div
        className="absolute inset-[-20px] rounded-full border-2 border-[#ff2d95]/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[-40px] rounded-full border border-[#ff6bcb]/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

// ========== 2. FLOATING UI PANELS ==========
const FloatingPanels = () => {
  const panels = [
    { icon: Rocket, title: "Launch", color: "#ff2d95", x: "5%", y: "20%", delay: 0 },
    { icon: Activity, title: "Trade", color: "#ff6bcb", x: "85%", y: "25%", delay: 1 },
    { icon: Shield, title: "Secure", color: "#7c3aed", x: "10%", y: "70%", delay: 2 },
    { icon: Crown, title: "Earn", color: "#ffaa00", x: "90%", y: "75%", delay: 1.5 },
  ];

  return (
    <>
      {panels.map((panel, i) => (
        <motion.div
          key={i}
          className="absolute z-10"
          style={{ left: panel.x, top: panel.y }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ 
            opacity: [0.6, 0.9, 0.6],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: panel.delay,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.1, zIndex: 20 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-[#ff2d95]/20 blur-xl rounded-2xl" />
            <div className="relative bg-[#1A1A22]/60 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-xl">
              <panel.icon className="w-6 h-6" style={{ color: panel.color }} />
              <p className="text-xs text-white mt-1 font-medium">{panel.title}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
};

// ========== 3. INTERACTIVE ECOSYSTEM VISUAL ==========
const EcosystemVisual = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{ title: string; desc: string } | null>(null);

  const nodes = [
    { id: "launch", label: "Launch", icon: Rocket, color: "#ff2d95", desc: "Create your token in seconds. No coding required." },
    { id: "trade", label: "Trade", icon: Zap, color: "#ff6bcb", desc: "Buy and sell instantly on bonding curve." },
    { id: "discover", label: "Discover", icon: Compass, color: "#7c3aed", desc: "Find trending tokens and hidden gems." },
    { id: "earn", label: "Earn", icon: Crown, color: "#ffaa00", desc: "Create and earn from your community." },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[400px]">
      {/* SVG Connections */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2d95" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff6bcb" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Connection lines */}
        <line x1="50%" y1="20%" x2="25%" y2="60%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4">
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="50%" y1="20%" x2="75%" y2="60%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4">
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="25%" y1="60%" x2="50%" y2="80%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4">
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="75%" y1="60%" x2="50%" y2="80%" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6 6" opacity="0.4">
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
        </line>
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
          style={{ left: i === 0 ? "50%" : i === 1 ? "25%" : i === 2 ? "75%" : "50%", top: i === 0 ? "20%" : i <= 2 ? "60%" : "80%" }}
          whileHover={{ scale: 1.2 }}
          onHoverStart={() => { setActiveNode(node.id); setModalContent({ title: node.label, desc: node.desc }); }}
          onHoverEnd={() => { setActiveNode(null); setModalContent(null); }}
        >
          <div 
            className="relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-[#1A1A22]/60 backdrop-blur-sm"
            style={{ 
              borderColor: node.color,
              boxShadow: activeNode === node.id ? `0 0 30px ${node.color}` : "none"
            }}
          >
            <node.icon className="w-6 h-6" style={{ color: node.color }} />
          </div>
        </motion.div>
      ))}

      {/* Modal Popup */}
      <AnimatePresence>
        {modalContent && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-[#1A1A22]/90 backdrop-blur-xl rounded-2xl p-4 border border-[#ff2d95]/30 z-20 w-64 text-center"
          >
            <p className="text-white font-bold">{modalContent.title}</p>
            <p className="text-xs text-gray-400 mt-1">{modalContent.desc}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========== 4. CINEMATIC BUTTON ==========
const CinematicButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripple, setRipple] = useState(false);

  const handleClick = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    onClick();
  };

  return (
    <motion.button
      className="relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-bold text-base overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        boxShadow: isHovered ? "0 0 30px rgba(255,45,149,0.6)" : "0 6px 24px rgba(255,45,149,0.3)"
      }}
    >
      {/* Ripple effect */}
      <AnimatePresence>
        {ripple && (
          <motion.span
            className="absolute inset-0 rounded-2xl bg-white"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
      
      {/* Magnetic effect inner glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent"
        animate={{ opacity: isHovered ? 0.3 : 0 }}
      />
      
      <span className="relative flex items-center gap-2">
        {children}
        <motion.div animate={{ x: isHovered ? 5 : 0 }}>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </span>
    </motion.button>
  );
};

// ========== 5. PARTICLE GRID BACKGROUND ==========
const ParticleGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: { x: number; y: number; size: number; speedX: number; speedY: number }[] = [];
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = 80;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
        });
      }
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      ctx.strokeStyle = "rgba(255,45,149,0.03)";
      ctx.lineWidth = 0.5;
      const step = 60;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        ctx.fillStyle = `rgba(255,45,149,${0.1 + Math.sin(Date.now() * 0.001 + i) * 0.05})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      
      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ========== MAIN HOMEPAGE ==========
export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();

  const handleCreate = () => {
    if (!connected) {
      // Show wallet connect modal
      return;
    }
    router.push("/create");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <ParticleGrid />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0F] to-[#0A0A0F]" />
      
      {/* Mouse glow */}
      <MouseGlow />
      
      {/* Floating elements */}
      <FloatingTokens />
      <FloatingPanels />
      
      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center">
        
        {/* Hero section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Launch Your Meme Coin
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] bg-clip-text text-transparent">
                in Seconds ⚡
              </span>
            </h1>
            <p className="text-gray-500 text-lg md:text-xl mt-6 max-w-2xl mx-auto">
              No code. No friction. Just launch.
            </p>
          </motion.div>
          
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <CinematicButton onClick={handleCreate}>
              <Rocket className="w-4 h-4" />
              Create Token
            </CinematicButton>
            
            <button className="px-6 py-4 rounded-2xl border border-white/10 text-gray-400 font-medium hover:text-white hover:border-white/20 transition-all duration-300">
              Explore Ecosystem
            </button>
          </motion.div>
        </div>
        
        {/* Interactive Orb & Ecosystem */}
        <div className="w-full max-w-6xl mx-auto mt-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <InteractiveOrb />
            </div>
            <div>
              <EcosystemVisual />
            </div>
          </div>
        </div>
        
        {/* Feature preview boxes */}
        <div className="grid md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl">
          {[
            { icon: Rocket, title: "Instant Launch", desc: "Create and launch in seconds", color: "#ff2d95" },
            { icon: Activity, title: "Bonding Curve", desc: "Fair price discovery", color: "#ff6bcb" },
            { icon: Crown, title: "No Platform Fees", desc: "Only network cost", color: "#7c3aed" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="relative group cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d95]/5 to-[#ff6bcb]/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-[#1A1A22]/40 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-[#ff2d95]/30 transition-all duration-300">
                <feature.icon className="w-8 h-8 mb-4" style={{ color: feature.color }} />
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mouse Glow Component (add at top with other components)
const MouseGlow = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  
  const glowX = useTransform(springX, (x) => x - 250);
  const glowY = useTransform(springY, (y) => y - 250);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed pointer-events-none z-30 w-[500px] h-[500px] rounded-full bg-[#ff2d95]/8 blur-[100px]"
      style={{ x: glowX, y: glowY }}
    />
  );
};

// Floating Tokens Component
const FloatingTokens = () => {
  const tokens = [
    { name: "PEPEKING", change: "+342%", icon: "👑", x: "5%", y: "15%", delay: 0 },
    { name: "MOONDOG", change: "+128%", icon: "🐕", x: "88%", y: "20%", delay: 1 },
    { name: "CATWIF", change: "+89%", icon: "🐱", x: "92%", y: "65%", delay: 2 },
    { name: "WHALE", change: "+256%", icon: "🐋", x: "8%", y: "75%", delay: 0.5 },
  ];

  return (
    <>
      {tokens.map((token, i) => (
        <motion.div
          key={i}
          className="absolute z-0 hidden lg:block"
          style={{ left: token.x, top: token.y }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: token.delay,
            ease: "easeInOut"
          }}
        >
          <div className="bg-[#1A1A22]/40 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm">{token.icon}</span>
              <span className="text-xs text-white">{token.name}</span>
              <span className="text-xs text-green-400">{token.change}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
};