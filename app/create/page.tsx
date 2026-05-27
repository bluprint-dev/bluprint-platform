"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { PublicKey, SystemProgram, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createAndRegisterLaunch } from "@metaplex-foundation/genesis";
import { genesis } from "@metaplex-foundation/genesis";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Rocket, Upload, Check, AlertCircle, Loader2, ImageIcon, Copy, ExternalLink } from "lucide-react";
import Footer from "@/app/components/Footer";

const CREATE_FEE_SOL = 0.01;
const FEE_DISTRIBUTION = [
  { address: "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x", percentage: 58 },
  { address: "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc", percentage: 32 },
  { address: "A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X", percentage: 10 },
];
const BONDING_CURVE_FEE_WALLET = "AimBpCdpPmTB5QeJ6WwgrBzNmMsjR3MvNe9zgNhzomZ6";

// Loading states
const LOADING_STEPS = [
  "Initializing token",
  "Uploading metadata",
  "Creating bonding curve",
  "Deploying",
  "Confirmed"
];

export default function CreatePage() {
  const { connected, publicKey, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
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
  
  // Simulated market cap
  const [simulatedMcap, setSimulatedMcap] = useState(4200);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedMcap(prev => prev + Math.floor(Math.random() * 50) - 20);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!tokenName.trim() || tokenName.length < 2) e.name = "Min 2 characters";
    if (tokenName.length > 32) e.name = "Max 32 characters";
    if (!tokenSymbol.trim() || tokenSymbol.length < 2) e.symbol = "Min 2 characters";
    if (tokenSymbol.length > 10) e.symbol = "Max 10 characters";
    if (!/^[A-Za-z0-9]+$/.test(tokenSymbol)) e.symbol = "Letters and numbers only";
    if (!uploadedImageUrl) e.image = "Image required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadingImage(true);
    setErrors((prev) => ({ ...prev, image: "" }));
    
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
    if (!connected || !publicKey) { setError("Connect your wallet first"); return; }
    if (!wallet?.adapter) { setError("Wallet adapter not ready"); return; }
    if (!uploadedImageUrl) { setError("Image upload not complete"); return; }
    
    setIsLoading(true);
    setError("");
    setLoadingStep(0);
    
    try {
      // Step 1: Fee transaction
      setLoadingStep(1);
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
      
      // Step 2: Token launch
      setLoadingStep(2);
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
      
      // Step 3: Track launch
      setLoadingStep(3);
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
      
      setLoadingStep(4);
      setTimeout(() => setLoadingStep(5), 500);
      
      setMintAddress(result.mintAddress);
      setLaunchLink(result.launch?.link || null);
      setSuccess(true);
      
    } catch (err: any) {
      console.error("Create error:", err);
      if (err.message?.includes("block height exceeded") || err.message?.includes("expired")) {
        setError("Network busy. Please try again.");
      } else {
        setError(err.message?.includes("rejected") ? "Transaction cancelled" : err.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyMint = () => {
    if (!mintAddress) return;
    navigator.clipboard.writeText(mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live token preview
  const previewSymbol = tokenSymbol || "TOKEN";
  const previewName = tokenName || "Token Name";

  return (
    <div className="relative min-h-screen bg-[#050816]">
      
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-[#050816]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-xs text-gray-600">Create Token</div>
          <div className="w-4" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* LEFT SIDE - Live Preview & Simulation */}
          <div className="space-y-8">
            
            {/* Token Preview Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-4 mb-6">
                {imagePreview ? (
                  <img src={imagePreview} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">{previewSymbol}</span>
                    <span className="text-xs text-gray-600">{previewName}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase">Market Cap</p>
                      <p className="text-sm font-mono text-blue-400">${simulatedMcap.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase">Price</p>
                      <p className="text-sm font-mono text-green-400">${(simulatedMcap / 1000000).toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mini bonding curve visualization */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="h-16 flex items-end gap-[2px]">
                  {[...Array(30)].map((_, i) => (
                    <div 
                      key={i}
                      className="flex-1 bg-blue-500/30 rounded-t-sm"
                      style={{ height: `${20 + Math.sin(i * 0.5 + Date.now() * 0.002) * 10 + (i / 30) * 30}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-600">
                  <span>Launch</span>
                  <span>Graduation</span>
                </div>
              </div>
            </div>
            
            {/* Swap Feed */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <p className="text-[10px] text-gray-600 uppercase mb-4">Live Activity</p>
              <div className="space-y-2">
                {[
                  "0.4 SOL → DOGX",
                  "1.2 SOL → DOGX",
                  "0.8 SOL → DOGX"
                ].map((trade, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="text-xs text-gray-500 font-mono"
                  >
                    {trade}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* RIGHT SIDE - Create Form */}
          <div className="space-y-6">
            
            {/* Form */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              
              {/* Image upload */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Token Image</label>
                <div className="flex items-center gap-4">
                  <label className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer group border border-white/10 bg-white/5 flex items-center justify-center">
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
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={e => setTokenName(e.target.value)}
                  placeholder="DOGX"
                  maxLength={32}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition"
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              
              {/* Symbol */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Symbol</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={e => setTokenSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="DOGX"
                  maxLength={10}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition font-mono"
                />
                {errors.symbol && <p className="text-xs text-red-400 mt-1">{errors.symbol}</p>}
              </div>
              
              {/* Description */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Description (optional)</label>
                <textarea
                  value={tokenDescription}
                  onChange={e => setTokenDescription(e.target.value)}
                  placeholder="Dog Empire on Solana"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition resize-none"
                />
              </div>
              
              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={!validate() || uploadingImage || !connected}
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Launch on Solana
                </span>
              </button>
              
              {!connected && (
                <p className="text-xs text-center text-gray-600">Connect wallet to launch</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && !success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050816]/95 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center space-y-6">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <div className="space-y-2 font-mono text-sm">
                {LOADING_STEPS.map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: loadingStep > i ? 1 : 0.3 }}
                    className="text-gray-400"
                  >
                    {loadingStep > i ? <Check className="w-4 h-4 inline mr-2 text-green-500" /> : <span className="inline-block w-4 mr-2" />}
                    {step}
                  </motion.div>
                ))}
              </div>
              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                  <button onClick={() => setIsLoading(false)} className="block mx-auto mt-3 text-xs text-gray-500 hover:text-white">
                    Go back
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Screen */}
      <AnimatePresence>
        {success && mintAddress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 bg-[#050816]/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full space-y-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Token Deployed</h2>
                <p className="text-gray-500 text-sm mt-1">{tokenSymbol} is now live on Blueprint</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-[10px] text-gray-500 uppercase mb-2">Mint Address</p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="text-xs text-blue-400 font-mono break-all">{mintAddress.slice(0, 8)}...{mintAddress.slice(-8)}</code>
                  <button onClick={copyMint} className="p-1 hover:bg-white/10 rounded transition">
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => router.push("/dex")} className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium">
                  Trade on DEX
                </button>
                <button onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, "_blank")} className="flex-1 h-10 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition">
                  Solscan
                </button>
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