"use client";

import Footer from "@/app/components/Footer";
import { useState } from "react";
import Footer from "@/app/components/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import Footer from "@/app/components/Footer";
import { useConnection } from "@solana/wallet-adapter-react";
import Footer from "@/app/components/Footer";
import { useRouter } from "next/navigation";
import Footer from "@/app/components/Footer";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Footer from "@/app/components/Footer";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import Footer from "@/app/components/Footer";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import Footer from "@/app/components/Footer";
import { createAndRegisterLaunch } from "@metaplex-foundation/genesis";
import Footer from "@/app/components/Footer";
import { genesis } from "@metaplex-foundation/genesis";
import Footer from "@/app/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/app/components/Footer";
import {
  ArrowLeft, Rocket, Upload, Shield, Check, AlertCircle,
  Flame, PartyPopper, ExternalLink, Copy, Loader2, ImageIcon, 
  Sparkles, Star, Crown, Zap, Gift, TrendingUp
} from "lucide-react";

const CREATE_FEE_SOL = 0.01;
const FREE_TIER_LIMIT = 150;
const FEE_DISTRIBUTION = [
  { address: "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x", percentage: 58 },
  { address: "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc", percentage: 32 },
  { address: "A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X", percentage: 10 },
];
const BONDING_CURVE_FEE_WALLET = "Hn5UBz1BSDNzJVwbTx3KAK64gFBwtWoAaFbg2jCg6Vq5";
const STEPS = ["Info", "Review", "Launch"];

export default function CreatePage() {
  const { connected, publicKey, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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

  // Simulate total tokens count (will be fetched from API)
  const totalTokensCreated = 87; // This should come from API
  const isFirst150 = totalTokensCreated < FREE_TIER_LIMIT;
  const remainingFree = FREE_TIER_LIMIT - totalTokensCreated;

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
      if (data.success) { setUploadedImageUrl(data.imageUrl); }
      else { setErrors((prev) => ({ ...prev, image: data.error || "Upload failed" })); setImagePreview(null); }
    } catch {
      setErrors((prev) => ({ ...prev, image: "Upload failed" })); setImagePreview(null);
    } finally { setUploadingImage(false); }
  };

  const handleCreate = async () => {
    if (!connected || !publicKey) { setError("Connect your wallet first"); return; }
    if (!wallet?.adapter) { setError("Wallet adapter not ready"); return; }
    if (!uploadedImageUrl) { setError("Image upload not complete"); return; }
    setIsLoading(true); setError("");
    try {
      const tx = new Transaction();
      const totalLamports = Math.floor(CREATE_FEE_SOL * 1_000_000_000);
      for (const dist of FEE_DISTRIBUTION) {
        const amount = Math.floor((totalLamports * dist.percentage) / 100);
        if (amount > 0) tx.add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(dist.address), lamports: amount }));
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash; tx.feePayer = publicKey;
      const feeSig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: feeSig, blockhash, lastValidBlockHeight }, "confirmed");
      const umi = createUmi(connection.rpcEndpoint).use(genesis());
      umi.use(walletAdapterIdentity(wallet.adapter));
      const result = await createAndRegisterLaunch(umi, {}, {
        wallet: publicKey.toString(), launchType: "bondingCurve",
        token: { name: tokenName, symbol: tokenSymbol, image: uploadedImageUrl, description: tokenDescription || "" },
        launch: { creatorFeeWallet: BONDING_CURVE_FEE_WALLET },
      } as any);
      await fetch("/api/track-launch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mintAddress: result.mintAddress, name: tokenName, symbol: tokenSymbol, imageUrl: uploadedImageUrl, userPublicKey: publicKey.toString(), signature: feeSig }),
      });
      setMintAddress(result.mintAddress); setLaunchLink(result.launch?.link || null); setSuccess(true);
    } catch (err: any) {
      setError(err.message?.includes("rejected") ? "Transaction cancelled" : err.message || "Something went wrong");
    } finally { setIsLoading(false); }
  };

  const copyMint = () => {
    if (!mintAddress) return;
    navigator.clipboard.writeText(mintAddress);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle = (hasError?: boolean) => ({
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${hasError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
  });

  return (
    <div className="relative z-10 min-h-screen">

      {/* TOPBAR */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0F]/90 backdrop-blur-2xl">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-4">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/6 text-gray-600 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#ff2d95,#ff6bcb)", boxShadow: "0 4px 14px rgba(255,45,149,0.35)" }}>
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">Create Token</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Bonding curve · 0.01 SOL</p>
            </div>
          </div>

          {/* Steps */}
          <div className="ml-auto flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition ${
                  i < step ? "text-green-400" : i === step ? "text-[#ff2d95]" : "text-gray-700"
                }`}
                  style={{
                    background: i < step ? "rgba(34,197,94,0.1)" : i === step ? "rgba(255,45,149,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${i < step ? "rgba(34,197,94,0.2)" : i === step ? "rgba(255,45,149,0.25)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                  {i < step ? <Check className="w-2.5 h-2.5" /> : <span>{i+1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-4 h-px" style={{ background: i < step ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <AnimatePresence mode="wait">

          {/* STEP 0: INFO */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">

              {/* PROMO BANNER - First 150 tokens */}
              <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#ff2d95]/20 via-[#ff6bcb]/10 to-[#ff2d95]/20 border border-[#ff2d95]/30">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#ff2d95]/20 rounded-full blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ff2d95]/20 flex items-center justify-center">
                    {isFirst150 ? <Gift className="w-5 h-5 text-[#ff2d95]" /> : <Star className="w-5 h-5 text-[#ff2d95]" />}
                  </div>
                  <div className="flex-1">
                    {isFirst150 ? (
                      <>
                        <p className="text-sm font-bold text-white">🎁 FIRST {FREE_TIER_LIMIT} TOKENS PROMO</p>
                        <p className="text-xs text-gray-300">You are early! Only {remainingFree} spots left for 0.01 SOL fee</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white">✨ STANDARD LAUNCH FEE</p>
                        <p className="text-xs text-gray-300">First {FREE_TIER_LIMIT} tokens launched at 0.01 SOL. Regular fee applies after.</p>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{isFirst150 ? "0.01" : "0.05"} SOL</p>
                    <p className="text-[10px] text-gray-500">create fee</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] rounded-full transition-all duration-500"
                    style={{ width: `${(totalTokensCreated / FREE_TIER_LIMIT) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  {totalTokensCreated} / {FREE_TIER_LIMIT} tokens created
                </p>
              </div>

              {/* Main Card */}
              <div className="rounded-2xl p-6 space-y-6"
                style={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.07)" }}>

                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#ff2d95]" />
                  <h2 className="text-base font-black text-white">Token Information</h2>
                </div>

                {/* Image Upload */}
                <div>
                  <p className="text-xs text-gray-500 mb-3 font-medium">Token Image *</p>
                  <div className="flex items-center gap-5">
                    <label className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer group flex-shrink-0 transition"
                      style={{
                        border: errors.image ? "2px solid rgba(239,68,68,0.5)" : imagePreview ? "2px solid rgba(255,45,149,0.4)" : "2px dashed rgba(255,255,255,0.1)",
                      }}>
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            style={{ background: "rgba(0,0,0,0.55)" }}>
                            <Upload className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5"
                          style={{ background: "rgba(0,0,0,0.3)" }}>
                          {uploadingImage
                            ? <Loader2 className="w-4 h-4 text-[#ff2d95] animate-spin" />
                            : <><ImageIcon className="w-5 h-5 text-gray-700" /><span className="text-[9px] text-gray-700">Upload</span></>}
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>

                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-600">PNG · JPG · GIF · WEBP</p>
                      <p className="text-[11px] text-gray-700">Max 5MB · Square recommended</p>
                      {uploadedImageUrl && !uploadingImage && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-[11px] text-green-500 font-medium">Saved to Arweave</span>
                        </div>
                      )}
                      {uploadingImage && (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 text-[#ff2d95] animate-spin" />
                          <span className="text-[11px] text-gray-600">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.image && <p className="text-xs text-red-400 mt-2">{errors.image}</p>}
                </div>

                {/* Token Name */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Token Name *</p>
                  <input
                    type="text" value={tokenName}
                    onChange={e => setTokenName(e.target.value)}
                    placeholder="e.g. Pink Whale"
                    maxLength={32}
                    className="w-full h-11 px-4 rounded-xl text-white text-sm placeholder-gray-800 focus:outline-none transition"
                    style={inputStyle(!!errors.name)}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(255,45,149,0.45)"}
                    onBlur={e => e.currentTarget.style.borderColor = errors.name ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.name ? <p className="text-[11px] text-red-400">{errors.name}</p> : <span />}
                    <span className="text-[10px] text-gray-800">{tokenName.length}/32</span>
                  </div>
                </div>

                {/* Token Symbol */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Symbol *</p>
                  <input
                    type="text" value={tokenSymbol}
                    onChange={e => setTokenSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                    placeholder="PINK"
                    maxLength={10}
                    className="w-full h-11 px-4 rounded-xl text-white text-sm font-mono tracking-[0.2em] placeholder-gray-800 focus:outline-none transition"
                    style={inputStyle(!!errors.symbol)}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(255,45,149,0.45)"}
                    onBlur={e => e.currentTarget.style.borderColor = errors.symbol ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.symbol ? <p className="text-[11px] text-red-400">{errors.symbol}</p> : <span />}
                    <span className="text-[10px] text-gray-800">{tokenSymbol.length}/10</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Description <span className="text-gray-700 font-normal">(optional)</span></p>
                  <textarea
                    value={tokenDescription}
                    onChange={e => setTokenDescription(e.target.value)}
                    placeholder="Tell the community about your token..."
                    rows={3} maxLength={500}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-800 focus:outline-none transition resize-none"
                    style={inputStyle()}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(255,45,149,0.45)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-800">{tokenDescription.length}/500</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { if (validate()) setStep(1); }}
                disabled={uploadingImage}
                className="w-full h-13 py-4 rounded-2xl text-white font-black text-sm transition disabled:opacity-40 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#ff2d95,#ff6bcb)",
                  boxShadow: "0 6px 24px rgba(255,45,149,0.3)",
                }}>
                Continue
                <span className="text-base">→</span>
              </button>
            </motion.div>
          )}

          {/* STEP 1: REVIEW */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">

              {/* Review Card */}
              <div className="rounded-2xl p-6 space-y-5"
                style={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.07)" }}>

                <div className="flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-[#ff2d95]" />
                  <h2 className="text-base font-black text-white">Review & Confirm</h2>
                </div>

                {/* Token Preview */}
                <div className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "rgba(255,45,149,0.04)", border: "1px solid rgba(255,45,149,0.12)" }}>
                  {imagePreview ? (
                    <img src={imagePreview} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" style={{ border: "1px solid rgba(255,45,149,0.2)" }} />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <ImageIcon className="w-5 h-5 text-gray-700" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg font-black text-white">{tokenName}</span>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,45,149,0.15)", color: "#ff2d95", border: "1px solid rgba(255,45,149,0.2)" }}>
                        ${tokenSymbol}
                      </span>
                    </div>
                    {tokenDescription && <p className="text-xs text-gray-600 line-clamp-2">{tokenDescription}</p>}
                  </div>
                </div>

                {/* Details Table */}
                <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  {[
                    { label: "Launch type", value: "Bonding Curve", icon: <TrendingUp className="w-3 h-3" /> },
                    { label: "Create fee", value: isFirst150 ? "0.01 SOL" : "0.05 SOL", icon: <Zap className="w-3 h-3" /> },
                    { label: "Platform fee", value: "0%", icon: <Gift className="w-3 h-3" /> },
                    { label: "Network", value: "Solana Mainnet", icon: <Crown className="w-3 h-3" /> },
                    { label: "Storage", value: "Arweave (permanent)", icon: <Shield className="w-3 h-3" /> },
                  ].map((row, i) => (
                    <div key={row.label} className="flex justify-between items-center px-4 py-3 text-sm"
                      style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span className="text-gray-500 flex items-center gap-1.5">
                        {row.icon}
                        {row.label}
                      </span>
                      <span className="text-white font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Bonding curve info */}
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: "rgba(255,45,149,0.04)", border: "1px solid rgba(255,45,149,0.1)" }}>
                  <Shield className="w-4 h-4 text-[#ff2d95] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">Fair launch · Bonding curve</p>
                    <p className="text-xs text-gray-600 leading-relaxed">Price rises automatically with every buy. No pre-sale, no insider allocation. Fully on-chain via Metaplex Genesis.</p>
                  </div>
                </div>

                {!connected && (
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">Connect your wallet to continue</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)}
                  className="flex-1 h-12 rounded-2xl text-sm font-semibold text-gray-500 hover:text-white transition"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  ← Back
                </button>
                <button
                  onClick={() => { setStep(2); handleCreate(); }}
                  disabled={!connected}
                  className="flex-[2] h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-35"
                  style={{
                    background: "linear-gradient(135deg,#ff2d95,#ff6bcb)",
                    boxShadow: "0 6px 24px rgba(255,45,149,0.3)",
                  }}>
                  <Rocket className="w-4 h-4" />
                  Launch Token
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LAUNCHING */}
          {step === 2 && !success && (
            <motion.div key="s2" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-6">

              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,45,149,0.1)", border: "1px solid rgba(255,45,149,0.2)" }}>
                  <Rocket className="w-8 h-8 text-[#ff2d95]" />
                </div>
                <div className="absolute inset-0 rounded-full border border-[#ff2d95]/25 animate-ping" />
                <div className="absolute -inset-3 rounded-full border border-[#ff2d95]/10 animate-ping" style={{ animationDelay: "0.3s" }} />
              </div>

              <div className="text-center">
                <h3 className="text-xl font-black text-white mb-2">Launching your token...</h3>
                <p className="text-sm text-gray-600">Confirm the transactions in your wallet</p>
              </div>

              {error && (
                <div className="w-full max-w-xs rounded-xl p-4 flex items-start gap-3"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400">{error}</p>
                    <button onClick={() => { setStep(1); setError(""); }} className="text-xs text-red-400/60 hover:text-red-400 mt-1 underline">
                      Go back
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SUCCESS */}
          {success && mintAddress && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 py-10">

              <div className="relative">
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#ff2d95,#ff6bcb)", boxShadow: "0 0 60px rgba(255,45,149,0.4)" }}>
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </div>
                {[...Array(5)].map((_,i) => (
                  <motion.div key={i}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    transition={{ duration: 1, delay: i * 0.15 }}
                    className="absolute inset-0 rounded-full"
                    style={{ border: "1px solid rgba(255,45,149,0.3)" }}
                  />
                ))}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-[#ff2d95]" />
                  <h2 className="text-3xl font-black text-white">Token is Live!</h2>
                  <Sparkles className="w-5 h-5 text-[#ff2d95]" />
                </div>
                <p className="text-gray-600 text-sm">
                  <span className="font-bold" style={{ color: "#ff2d95" }}>${tokenSymbol}</span> is now trading on the bonding curve
                </p>
              </div>

              {/* Mint address */}
              <div className="w-full rounded-2xl p-4"
                style={{ background: "rgba(255,45,149,0.04)", border: "1px solid rgba(255,45,149,0.12)" }}>
                <p className="text-[10px] text-gray-700 mb-2 font-semibold uppercase tracking-widest">Mint Address</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-xs font-mono break-all leading-relaxed" style={{ color: "#ff2d95" }}>
                    {mintAddress}
                  </code>
                  <button onClick={copyMint}
                    className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition hover:bg-white/6"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full space-y-2.5">
                <button onClick={() => router.push("/dex")}
                  className="w-full h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#ff2d95,#ff6bcb)", boxShadow: "0 6px 24px rgba(255,45,149,0.3)" }}>
                  Trade on DEX →
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => window.open(`https://solscan.io/token/${mintAddress}`,"_blank")}
                    className="h-11 rounded-xl text-sm font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1.5 transition"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    Solscan
                  </button>
                  {launchLink && (
                    <button onClick={() => window.open(launchLink,"_blank")}
                      className="h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition hover:opacity-80"
                      style={{ background: "rgba(255,45,149,0.08)", border: "1px solid rgba(255,45,149,0.18)", color: "#ff2d95" }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      Genesis
                    </button>
                  )}
                </div>

                <button onClick={() => {
                    setStep(0); setSuccess(false); setTokenName(""); setTokenSymbol("");
                    setTokenDescription(""); setImagePreview(null); setUploadedImageUrl(null);
                    setMintAddress(null); setLaunchLink(null);
                  }}
                  className="w-full py-2.5 text-xs text-gray-700 hover:text-gray-500 transition">
                  Create another token
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    
      <Footer />
    </div>
  );
}