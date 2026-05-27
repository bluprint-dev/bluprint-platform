"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { PublicKey, SystemProgram, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createAndRegisterLaunch } from "@metaplex-foundation/genesis";
import { genesis } from "@metaplex-foundation/genesis";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Rocket, Upload, Check, AlertCircle, Loader2, Copy, Sparkles, Activity } from "lucide-react";
import Footer from "@/app/components/Footer";

const CREATE_FEE_SOL = 0.01;
const FEE_DISTRIBUTION = [
  { address: "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x", percentage: 58 },
  { address: "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc", percentage: 32 },
  { address: "A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X", percentage: 10 },
];
const BONDING_CURVE_FEE_WALLET = "AimBpCdpPmTB5QeJ6WwgrBzNmMsjR3MvNe9zgNhzomZ6";

const TERMINAL_MESSAGES = [
  "Uploading metadata...",
  "Initializing bonding curve...",
  "Seeding liquidity...",
  "Awaiting confirmation...",
];

// SSR-safe background nodes
const STATIC_NODES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  duration: 8 + Math.random() * 10,
  delay: Math.random() * 5,
}));

export default function CreatePage() {
  const { connected, publicKey, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  // Responsive state
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // State'ler
  const [isLoading, setIsLoading] = useState(false);
  const [terminalStep, setTerminalStep] = useState(-1);
  const [terminalText, setTerminalText] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [launchLink, setLaunchLink] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFocused, setIsFocused] = useState(false);

  // Terminal tip animation
  useEffect(() => {
    if (terminalStep >= 0 && terminalStep < TERMINAL_MESSAGES.length) {
      const fullText = TERMINAL_MESSAGES[terminalStep];
      let i = 0;
      setTerminalText("");
      const interval = setInterval(() => {
        if (i <= fullText.length) {
          setTerminalText(fullText.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [terminalStep]);

  // ESC ile loading'den çıkma
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoading) setIsLoading(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading]);

  // Başarı partikülleri
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    if (success) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 2000);
    }
  }, [success]);

  // Validation
  const isFormValid = useMemo(() => {
    const e: Record<string, string> = {};
    if (!tokenName.trim() || tokenName.length < 2) e.name = "Min 2 characters";
    if (tokenName.length > 32) e.name = "Max 32 characters";
    if (!tokenSymbol.trim() || tokenSymbol.length < 2) e.symbol = "Min 2 characters";
    if (tokenSymbol.length > 10) e.symbol = "Max 10 characters";
    if (!/^[A-Za-z0-9]+$/.test(tokenSymbol)) e.symbol = "Letters and numbers only";
    if (!uploadedImageUrl) e.image = "Image required";
    return { valid: Object.keys(e).length === 0, errors: e };
  }, [tokenName, tokenSymbol, uploadedImageUrl]);

  const handleSubmit = () => {
    setErrors(isFormValid.errors);
    if (!isFormValid.valid) return;
    handleCreate();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadedImageUrl(data.imageUrl);
      } else {
        setErrors((prev) => ({ ...prev, image: data.error || "Upload failed" }));
        setImagePreview(null);
      }
    } catch {
      setErrors((prev) => ({ ...prev, image: "Upload failed" }));
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    if (!connected || !publicKey) { setError("Connect wallet"); return; }
    if (!wallet?.adapter) { setError("Wallet adapter not ready"); return; }
    if (!uploadedImageUrl) { setError("Image upload not complete"); return; }
    
    setIsLoading(true);
    setError("");
    setTerminalStep(0);
    
    try {
      // Fee Transaction
      const tx = new Transaction();
      const totalLamports = Math.floor(CREATE_FEE_SOL * 1_000_000_000);
      for (const dist of FEE_DISTRIBUTION) {
        const amount = Math.floor((totalLamports * dist.percentage) / 100);
        if (amount > 0) {
          tx.add(SystemProgram.transfer({ 
            fromPubkey: publicKey, 
            toPubkey: new PublicKey(dist.address), 
            lamports: amount 
          }));
        }
      }
      
      const priorityFee = 1_000_000;
      tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
      tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }));
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      
      const feeSig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });
      
      await connection.confirmTransaction(
        { signature: feeSig, blockhash, lastValidBlockHeight },
        'confirmed'
      );
      
      setTerminalStep(1);
      await new Promise(r => setTimeout(r, 800));
      
      // Token Launch
      const umi = createUmi(connection.rpcEndpoint).use(genesis());
      umi.use(walletAdapterIdentity(wallet.adapter));
      
      const result = await createAndRegisterLaunch(umi, {}, {
        wallet: publicKey.toString(),
        launchType: "bondingCurve",
        token: { 
          name: tokenName, 
          symbol: tokenSymbol, 
          image: uploadedImageUrl, 
          description: tokenDescription || "" 
        },
        launch: { creatorFeeWallet: BONDING_CURVE_FEE_WALLET },
      } as any);
      
      setTerminalStep(2);
      await new Promise(r => setTimeout(r, 800));
      
      // Track Launch
      await fetch("/api/track-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mintAddress: result.mintAddress, 
          name: tokenName, 
          symbol: tokenSymbol, 
          imageUrl: uploadedImageUrl, 
          userPublicKey: publicKey.toString(), 
          signature: feeSig 
        }),
      });
      
      setTerminalStep(3);
      await new Promise(r => setTimeout(r, 1200));
      
      setMintAddress(result.mintAddress);
      setLaunchLink(result.launch?.link || null);
      setSuccess(true);
      setIsLoading(false);
      setTerminalStep(-1);
      
    } catch (err: any) {
      console.error("Create error:", err);
      setError(err.message?.includes("block height exceeded") ? "Network busy. Try again." : err.message || "Something went wrong");
      setIsLoading(false);
      setTerminalStep(-1);
    }
  };

  const copyMint = () => {
    if (!mintAddress) return;
    navigator.clipboard.writeText(mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewSymbol = tokenSymbol || "TOKEN";

  return (
    <div className="relative min-h-screen bg-[#050816] overflow-hidden">
      
      {/* Animated background nodes */}
      <div className="absolute inset-0 pointer-events-none">
        {STATIC_NODES.map((node) => (
          <motion.div
            key={node.id}
            className="absolute w-1 h-1 rounded-full bg-blue-500/30"
            animate={{
              y: ["0%", "-20%", "0%", "20%", "0%"],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: node.duration,
              repeat: Infinity,
              delay: node.delay,
              ease: "easeInOut",
            }}
            style={{ left: node.left, top: node.top }}
          />
        ))}
      </div>
      
      {/* Giant blur orbs */}
      <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />
      
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-[#050816]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-xs text-gray-600 font-mono">Blueprint Ecosystem / Create</div>
          <div className="w-4" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT SIDE */}
          <motion.div 
            className="space-y-8"
            style={isDesktop ? { transform: "perspective(1200px) rotateY(-4deg)" } : {}}
          >
            <div>
              <h1 className="text-4xl font-bold text-white tracking-[-0.04em]">
                Create <span className="text-blue-400">·</span> Launch <span className="text-blue-400">·</span> Scale
              </h1>
              <p className="text-gray-500 text-sm mt-3">Enter the Blueprint ecosystem</p>
            </div>
            
            {/* Bonding curve */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Bonding Curve</span>
              </div>
              <svg width="100%" height="120" viewBox="0 0 400 120" className="w-full">
                <motion.path
                  d="M0 100 Q 100 20 200 80 T 400 30"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  strokeOpacity="0.15"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.path
                  d="M0 100 Q 100 20 200 80 T 400 30"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Terminal */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-600 ml-2">deployment.log</span>
              </div>
              <div className="space-y-1 font-mono text-sm">
                {TERMINAL_MESSAGES.map((msg, i) => (
                  <div 
                    key={msg} 
                    className={
                      terminalStep > i ? "text-green-400" : 
                      terminalStep === i ? "text-blue-400" : 
                      "text-gray-700"
                    }
                  >
                    {terminalStep > i && <Check className="w-4 h-4 inline mr-2" />}
                    {terminalStep === i ? terminalText : msg}
                    {terminalStep === i && <span className="animate-pulse">{'>'}</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* RIGHT SIDE */}
          <motion.div 
            className="relative"
            style={isDesktop ? { transform: "perspective(1200px) rotateY(4deg)" } : {}}
          >
            <div className={`rounded-2xl border transition-all duration-300 ${isFocused ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-white/10'} bg-white/[0.02] backdrop-blur-sm p-8`}>
              
              {/* Persistent error */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}
              
              {/* Image upload */}
              <div className="mb-6">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 block">Token Image</label>
                <div className="flex items-center gap-4">
                  <label className="relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer group border border-white/10 bg-white/5 flex items-center justify-center transition-all hover:border-blue-500/30">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" />
                    ) : (
                      uploadingImage ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <Upload className="w-4 h-4 text-gray-600" />
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {errors.image && <p className="text-xs text-red-400">{errors.image}</p>}
                </div>
              </div>
              
              {/* Token name */}
              <div className="mb-6">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={e => setTokenName(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="DOGX"
                  maxLength={32}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition-all"
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              
              {/* Symbol */}
              <div className="mb-6">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Symbol</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={e => setTokenSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="DOGX"
                  maxLength={10}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                />
                {errors.symbol && <p className="text-xs text-red-400 mt-1">{errors.symbol}</p>}
              </div>
              
              {/* Description */}
              <div className="mb-8">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Description (optional)</label>
                <textarea
                  value={tokenDescription}
                  onChange={e => setTokenDescription(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Dog Empire on Solana"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                />
              </div>
              
              {/* Button */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid.valid || uploadingImage || !connected}
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {isLoading ? "Deploying..." : "Launch on Solana"}
                </span>
              </button>
              
              {!connected && (
                <p className="text-xs text-center text-gray-600 mt-4">Connect wallet to enter ecosystem</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Cinematic Loading Overlay */}
      <AnimatePresence>
        {isLoading && !success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050816] flex items-center justify-center"
          >
            <div className="relative text-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping w-32 h-32 mx-auto" />
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-spin" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="space-y-3 font-mono text-sm">
                {TERMINAL_MESSAGES.map((msg, i) => (
                  <div key={msg} className={terminalStep >= i ? "text-blue-400" : "text-gray-700"}>
                    {terminalStep > i && <Check className="w-4 h-4 inline mr-2 text-green-500" />}
                    {terminalStep === i ? terminalText : msg}
                  </div>
                ))}
              </div>
              {error && (
                <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={() => setIsLoading(false)} className="mt-3 text-xs text-gray-500 hover:text-white">
                    Cancel (ESC)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Screen with Particle Explosion */}
      <AnimatePresence>
        {success && mintAddress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-[#050816] flex items-center justify-center p-6"
          >
            {/* Background radial burst */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_60%)]" />
            
            {/* Token watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[180px] font-black text-white/[0.03]">{previewSymbol}</span>
            </div>
            
            {/* Particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0.8, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full bg-blue-500"
              />
            ))}
            
            <div className="relative text-center space-y-8">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" style={{ animationDelay: "0.3s" }} />
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <Sparkles className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-5xl font-black text-white tracking-[-0.04em]">Token Deployed</h2>
                <p className="text-gray-500 text-base mt-2">{previewSymbol} is now live</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-w-md mx-auto">
                <p className="text-[10px] text-gray-500 uppercase mb-2">Mint Address</p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="text-xs text-blue-400 font-mono break-all">{mintAddress.slice(0, 8)}...{mintAddress.slice(-8)}</code>
                  <button onClick={copyMint} className="p-1 hover:bg-white/10 rounded transition">
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button onClick={() => router.push("/dex")} className="px-6 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium">
                  Trade on DEX
                </button>
                <button onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, "_blank", "noopener,noreferrer")} className="px-6 h-10 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition">
                  Solscan
                </button>
                {launchLink && (
                  <button onClick={() => window.open(launchLink, "_blank", "noopener,noreferrer")} className="px-6 h-10 rounded-xl border border-cyan-500/20 text-cyan-400 text-sm hover:text-white transition">
                    Open Launch
                  </button>
                )}
              </div>
              
              <button onClick={() => {
                setSuccess(false);
                setTokenName("");
                setTokenSymbol("");
                setTokenDescription("");
                setImagePreview(null);
                setUploadedImageUrl(null);
                setMintAddress(null);
              }} className="text-xs text-gray-600 hover:text-gray-400 transition">
                Create another token
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}