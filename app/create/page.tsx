"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

const BLACKLIST = ["SOL", "USDC", "USDT", "BONK", "WIF", "JUP", "PYTH", "JTO"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

export default function CreatePage() {
  const { connected, publicKey, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmitting = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [terminalStep, setTerminalStep] = useState(-1);
  const [terminalText, setTerminalText] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [launchLink, setLaunchLink] = useState<string | null>(null);

  const nodes = useMemo(() => {
    if (typeof window === "undefined") return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
  }, []);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoading) {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setIsLoading(false);
        setError("Cancelled - Transaction may still process on blockchain");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading]);

  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    if (!success) return;
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
    }));
    setParticles(newParticles);
    const timeout = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timeout);
  }, [success]);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!tokenName.trim() || tokenName.length < 2) errors.name = "Min 2 characters";
    if (tokenName.length > 32) errors.name = "Max 32 characters";
    if (!tokenSymbol.trim() || tokenSymbol.length < 2) errors.symbol = "Min 2 characters";
    if (tokenSymbol.length > 10) errors.symbol = "Max 10 characters";
    if (!/^[A-Za-z0-9]+$/.test(tokenSymbol)) errors.symbol = "Letters and numbers only";
    if (BLACKLIST.includes(tokenSymbol.toUpperCase())) errors.symbol = "Reserved ticker";
    if (!uploadedImageUrl) errors.image = "Image required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [tokenName, tokenSymbol, uploadedImageUrl]);

  const isDisabled = isLoading || uploadingImage || !connected || !tokenName || !tokenSymbol || !uploadedImageUrl;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationErrors((prev) => ({ ...prev, image: "Invalid file type" }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setValidationErrors((prev) => ({ ...prev, image: "File too large. Max 5MB" }));
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadingImage(true);
    setValidationErrors((prev) => ({ ...prev, image: "" }));
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadedImageUrl(data.imageUrl);
      } else {
        setValidationErrors((prev) => ({ ...prev, image: data.error || "Upload failed" }));
        setImagePreview(null);
      }
    } catch {
      setValidationErrors((prev) => ({ ...prev, image: "Upload failed" }));
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    if (!connected || !publicKey) { setError("Connect wallet"); return; }
    if (!wallet?.adapter) { setError("Wallet adapter not ready"); return; }
    if (!uploadedImageUrl) { setError("Image upload not complete"); return; }
    
    try {
      const balance = await connection.getBalance(publicKey);
      const requiredBalance = CREATE_FEE_SOL * 1_000_000_000 + 5000000;
      if (balance < requiredBalance) {
        setError(`Insufficient SOL. Need ${(requiredBalance / 1_000_000_000).toFixed(3)} SOL`);
        return;
      }
    } catch (balanceErr) {
      setError("Failed to check balance. Try again.");
      return;
    }
    
    isSubmitting.current = true;
    setIsLoading(true);
    setError("");
    setTerminalStep(0);
    
    try {
      // 1. Fee Transaction
      const tx = new Transaction();
      const totalLamports = Math.floor(CREATE_FEE_SOL * 1_000_000_000);
      
      let distributed = 0;
      for (let i = 0; i < FEE_DISTRIBUTION.length; i++) {
        const dist = FEE_DISTRIBUTION[i];
        const isLast = i === FEE_DISTRIBUTION.length - 1;
        let amount = Math.floor((totalLamports * dist.percentage) / 100);
        if (isLast) amount = totalLamports - distributed;
        if (amount > 0) {
          tx.add(SystemProgram.transfer({ 
            fromPubkey: publicKey, 
            toPubkey: new PublicKey(dist.address), 
            lamports: amount 
          }));
          distributed += amount;
        }
      }
      
      const priorityFee = 1_000_000;
      tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
      tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }));
      
      const latestBlockhash = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = publicKey;
      
      const feeSig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });
      
      await connection.confirmTransaction({
        signature: feeSig,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, 'finalized');
      
      setTerminalStep(1);
      await new Promise(r => setTimeout(r, 800));
      
      // 2. Verify payment with backend
      const verifyRes = await fetch("/api/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: feeSig,
          userPublicKey: publicKey.toString(),
          tokenData: {
            name: tokenName,
            symbol: tokenSymbol,
            imageUrl: uploadedImageUrl,
            description: tokenDescription || "",
          },
        }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed");
      }
      
      setTerminalStep(2);
      await new Promise(r => setTimeout(r, 800));
      
      // 3. CREATE TOKEN ON FRONTEND (with user signer)
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
      
      setTerminalStep(3);
      await new Promise(r => setTimeout(r, 800));
      
      // 4. Track launch
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
      
      setMintAddress(result.mintAddress);
      setLaunchLink(result.launch?.link || null);
      setSuccess(true);
      setIsLoading(false);
      setTerminalStep(-1);
      
    } catch (err: any) {
      console.error("Create error:", err);
      if (err.message?.includes("block height exceeded") || err.message?.includes("expired")) {
        setError("Network busy. Try again.");
      } else {
        setError(err.message || "Something went wrong");
      }
      setIsLoading(false);
      setTerminalStep(-1);
    } finally {
      isSubmitting.current = false;
    }
  };

  const copyMint = () => {
    if (!mintAddress) return;
    navigator.clipboard.writeText(mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewSymbol = tokenSymbol || "TOKEN";

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-[#050816] overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute w-1 h-1 rounded-full bg-[#ff2d95]/40"
            animate={{ y: ["0%", "-20%", "0%", "20%", "0%"], opacity: [0, 0.5, 0] }}
            transition={{ duration: node.duration, repeat: Infinity, delay: node.delay, ease: "easeInOut" }}
            style={{ left: node.left, top: node.top }}
          />
        ))}
      </div>
      
      <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-[#ff2d95]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[10%] w-[400px] h-[400px] bg-[#ff6bcb]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-[#ff2d95]/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,45,149,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,45,149,0.02)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />
      
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
          
          <motion.div className="space-y-8" style={isDesktop ? { transform: "perspective(1200px) rotateY(-4deg)" } : {}}>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-[-0.04em]">
                Create <span className="text-[#ff2d95]">·</span> Launch <span className="text-[#ff2d95]">·</span> Scale
              </h1>
              <p className="text-gray-500 text-sm mt-3">Enter the Blueprint ecosystem</p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-3 h-3 text-[#ff2d95]" />
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
                    <stop offset="0%" stopColor="#ff2d95" />
                    <stop offset="100%" stopColor="#ff6bcb" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-600 ml-2">deployment.log</span>
              </div>
              <div className="space-y-1 font-mono text-sm">
                {TERMINAL_MESSAGES.map((msg, i) => (
                  <div key={msg} className={terminalStep > i ? "text-green-400" : terminalStep === i ? "text-[#ff2d95]" : "text-gray-700"}>
                    {terminalStep > i && <Check className="w-4 h-4 inline mr-2" />}
                    {terminalStep === i ? terminalText : msg}
                    {terminalStep === i && <span className="animate-pulse">{'>'}</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <motion.div className="relative" style={isDesktop ? { transform: "perspective(1200px) rotateY(4deg)" } : {}}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8">
              
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 block">Token Image</label>
                <div className="flex items-center gap-4">
                  <label className="relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer group border border-white/10 bg-white/5 flex items-center justify-center transition-all hover:border-[#ff2d95]/30">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" />
                    ) : (
                      uploadingImage ? <Loader2 className="w-4 h-4 text-[#ff2d95] animate-spin" /> : <Upload className="w-4 h-4 text-gray-600" />
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {validationErrors.image && <p className="text-xs text-red-400">{validationErrors.image}</p>}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={e => setTokenName(e.target.value)}
                  placeholder="DOGX"
                  maxLength={32}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#ff2d95]/50 transition-all"
                />
                {validationErrors.name && <p className="text-xs text-red-400 mt-1">{validationErrors.name}</p>}
              </div>
              
              <div className="mb-6">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Symbol</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={e => setTokenSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="DOGX"
                  maxLength={10}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#ff2d95]/50 transition-all font-mono"
                />
                {validationErrors.symbol && <p className="text-xs text-red-400 mt-1">{validationErrors.symbol}</p>}
              </div>
              
              <div className="mb-8">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Description (optional)</label>
                <textarea
                  value={tokenDescription}
                  onChange={e => setTokenDescription(e.target.value)}
                  placeholder="Dog Empire on Solana"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#ff2d95]/50 transition-all resize-none"
                />
              </div>
              
              <button
                onClick={() => {
                  if (validateForm()) handleCreate();
                }}
                disabled={isDisabled}
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-medium text-sm overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
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
      
      <AnimatePresence>
        {isLoading && !success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#050816] flex items-center justify-center">
            <div className="relative text-center">
              <div className="absolute inset-0 rounded-full bg-[#ff2d95]/20 animate-ping w-32 h-32 mx-auto" />
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-[#ff2d95]/30 animate-spin" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="space-y-3 font-mono text-sm">
                {TERMINAL_MESSAGES.map((msg, i) => (
                  <div key={msg} className={terminalStep >= i ? "text-[#ff2d95]" : "text-gray-700"}>
                    {terminalStep > i && <Check className="w-4 h-4 inline mr-2 text-green-500" />}
                    {terminalStep === i ? terminalText : msg}
                  </div>
                ))}
              </div>
              {error && (
                <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={() => setIsLoading(false)} className="mt-3 text-xs text-gray-500 hover:text-white">Cancel (ESC)</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {success && mintAddress && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 bg-[#050816] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,45,149,0.15),transparent_60%)]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[180px] font-black text-white/[0.03]">{previewSymbol}</span>
            </div>
            {particles.map((p) => (
              <motion.div key={p.id} initial={{ x: 0, y: 0, opacity: 0.8, scale: 1 }} animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute w-2 h-2 rounded-full bg-[#ff2d95]" />
            ))}
            <div className="relative text-center space-y-8">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full bg-[#ff2d95]/20 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-[#ff2d95]/40 animate-ping" style={{ animationDelay: "0.3s" }} />
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] flex items-center justify-center">
                  {imagePreview ? <img src={imagePreview} className="w-16 h-16 rounded-full object-cover" /> : <Sparkles className="w-8 h-8 text-white" />}
                </div>
              </div>
              <div>
                <h2 className="text-5xl font-black text-white tracking-[-0.04em]">Token Deployed</h2>
                <p className="text-gray-500 text-base mt-2">{previewSymbol} is now live</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-w-md mx-auto">
                <p className="text-[10px] text-gray-500 uppercase mb-2">Mint Address</p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="text-xs text-[#ff2d95] font-mono break-all">{mintAddress?.slice(0, 8)}...{mintAddress?.slice(-8)}</code>
                  <button onClick={copyMint} className="p-1 hover:bg-white/10 rounded transition">
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={() => router.push("/dex")} className="px-6 h-10 rounded-xl bg-[#ff2d95] text-white text-sm font-medium">Trade on DEX</button>
                <button onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, "_blank", "noopener,noreferrer")} className="px-6 h-10 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition">Solscan</button>
                {launchLink && <button onClick={() => window.open(launchLink, "_blank", "noopener,noreferrer")} className="px-6 h-10 rounded-xl border border-[#ff2d95]/20 text-[#ff2d95] text-sm hover:text-white transition">Open Launch</button>}
              </div>
              <button onClick={() => {
                setSuccess(false);
                setTokenName("");
                setTokenSymbol("");
                setTokenDescription("");
                setImagePreview(null);
                setUploadedImageUrl(null);
                setMintAddress(null);
                setLaunchLink(null);
              }} className="text-xs text-gray-600 hover:text-gray-400 transition">Create another token</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}