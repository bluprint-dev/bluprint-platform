"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Transaction } from "@solana/web3.js";
import {
  ArrowLeft,
  Rocket,
  Upload,
  ImageIcon,
  Coins,
  Shield,
  Sparkles,
  Check,
  AlertCircle,
  Flame,
  PartyPopper,
} from "lucide-react";

export default function CreatePage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!tokenName.trim()) newErrors.tokenName = "Token name required";
    if (tokenName.length < 2) newErrors.tokenName = "Min 2 characters";
    if (tokenName.length > 32) newErrors.tokenName = "Max 32 characters";
    
    if (!tokenSymbol.trim()) newErrors.tokenSymbol = "Symbol required";
    if (tokenSymbol.length < 2) newErrors.tokenSymbol = "Min 2 characters";
    if (tokenSymbol.length > 10) newErrors.tokenSymbol = "Max 10 characters";
    if (!/^[A-Za-z0-9]+$/.test(tokenSymbol)) newErrors.tokenSymbol = "Only letters and numbers";
    
    if (!tokenImage) newErrors.tokenImage = "Image required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTokenImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateToken = async () => {
    if (!connected || !publicKey) {
      setError("Connect your wallet first");
      return;
    }
    
    if (!validateStep1()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("name", tokenName);
      formData.append("symbol", tokenSymbol);
      formData.append("description", tokenDescription);
      formData.append("logo", tokenImage!);
      formData.append("userPublicKey", publicKey.toString());
      
      const res = await fetch("/api/create-token", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);
      
      // Fee transaction'ı imzala ve gönder
      if (data.feeTransaction) {
        const feeTx = Transaction.from(Buffer.from(data.feeTransaction, 'base64'));
        const signature = await sendTransaction(feeTx, connection);
        await connection.confirmTransaction(signature);
        console.log("✅ Fee paid:", signature);
      }
      
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Network error");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-[#ff2d95]/20 bg-[#0A0A0F]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-[#ff2d95]/10 transition group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-[#ff2d95]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#ff2d95] to-[#ff6bcb] rounded-xl flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Create Token</h1>
                <p className="text-xs text-gray-500">Launch on Solana</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Steps */}
            <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6">
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                        step >= s 
                          ? "bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white" 
                          : "bg-[#1C1C1E] text-gray-500"
                      }`}>
                        {step > s ? <Check className="w-5 h-5" /> : s}
                      </div>
                      {s < 3 && (
                        <div className={`absolute top-1/2 -translate-y-1/2 w-full h-0.5 ${
                          step > s ? "bg-[#ff2d95]" : "bg-[#252525]"
                        }`} style={{ left: "100%", width: "calc(100% - 2rem)" }} />
                      )}
                    </div>
                    <span className="ml-3 text-sm text-gray-500 hidden sm:inline">
                      {s === 1 ? "Info" : s === 2 ? "Config" : "Review"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] rounded-2xl border border-[#252525] p-6 space-y-6"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#ff2d95]" />
                  <h2 className="text-xl font-bold text-white">Token Info</h2>
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-sm text-white mb-2">Token Image *</label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} className="w-24 h-24 rounded-2xl object-cover border-2 border-[#ff2d95]" />
                        <button
                          onClick={() => {
                            setTokenImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs hover:scale-110 transition"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#252525] bg-[#0A0A0F] flex flex-col items-center justify-center cursor-pointer hover:border-[#ff2d95] transition">
                        <Upload className="w-6 h-6 text-gray-500" />
                        <span className="text-xs text-gray-500 mt-1">Upload</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                  {errors.tokenImage && (
                    <p className="text-xs text-red-400 mt-1">{errors.tokenImage}</p>
                  )}
                </div>

                {/* Token Name */}
                <div>
                  <label className="block text-sm text-white mb-2">Token Name *</label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g., Pink Whale"
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2d95] transition"
                  />
                  {errors.tokenName && (
                    <p className="text-xs text-red-400 mt-1">{errors.tokenName}</p>
                  )}
                </div>

                {/* Token Symbol */}
                <div>
                  <label className="block text-sm text-white mb-2">Token Symbol *</label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., PINK"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2d95] transition uppercase"
                  />
                  {errors.tokenSymbol && (
                    <p className="text-xs text-red-400 mt-1">{errors.tokenSymbol}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-white mb-2">Description</label>
                  <textarea
                    value={tokenDescription}
                    onChange={(e) => setTokenDescription(e.target.value)}
                    placeholder="Tell the community about your token..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2d95] transition resize-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-semibold hover:shadow-lg hover:shadow-[#ff2d95]/30 transition"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] rounded-2xl border border-[#252525] p-6 space-y-6"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#ff2d95]" />
                  <h2 className="text-xl font-bold text-white">Configure</h2>
                </div>

                <div className="bg-[#ff2d95]/10 rounded-xl p-4 border border-[#ff2d95]/30">
                  <p className="text-sm text-gray-300">
                    Your token will launch on a bonding curve. Price increases with each buy.
                    Create fee: 0.01 SOL
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl border border-[#252525] text-white hover:bg-[#1C1C1E] transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-semibold hover:shadow-lg hover:shadow-[#ff2d95]/30 transition"
                  >
                    Review
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] rounded-2xl border border-[#252525] p-6 space-y-6"
              >
                <div className="flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-[#ff2d95]" />
                  <h2 className="text-xl font-bold text-white">Review & Launch</h2>
                </div>

                {/* Token Preview */}
                <div className="flex items-center gap-4 p-4 bg-[#0A0A0F] rounded-xl">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#1C1C1E] flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">{tokenName}</span>
                      <span className="text-sm text-[#ff2d95]">({tokenSymbol})</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{tokenDescription || "No description"}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-[#252525]">
                    <span className="text-gray-500">Name</span>
                    <span className="text-white font-medium">{tokenName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#252525]">
                    <span className="text-gray-500">Symbol</span>
                    <span className="text-white font-medium">{tokenSymbol}</span>
                  </div>
                </div>

                {/* Fee */}
                <div className="bg-[#0A0A0F] rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Create Fee</span>
                    <span className="text-white">0.01 SOL</span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl border border-[#252525] text-white hover:bg-[#1C1C1E] transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateToken}
                    disabled={isLoading || !connected}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] hover:from-[#ff2d95]/80 hover:to-[#ff6bcb]/80 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        Create Token
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success Modal */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <div className="bg-[#141414] rounded-2xl border border-[#ff2d95]/30 p-8 text-center max-w-md mx-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Success! 🎉</h3>
                    <p className="text-gray-400">Your token has been created!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6">
              <h3 className="font-semibold text-white mb-4">Wallet</h3>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                connected ? "bg-[#ff2d95]/10 border border-[#ff2d95]/30" : "bg-[#1C1C1E]"
              }`}>
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-[#ff2d95] animate-pulse" : "bg-red-500"}`} />
                <span className="text-sm text-white">{connected ? "Connected" : "Not Connected"}</span>
              </div>
              {!connected && (
                <p className="text-xs text-gray-500 mt-3">Connect your wallet to launch a token</p>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0F] rounded-2xl border border-[#252525] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#ff2d95]" />
                Benefits
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-[#ff2d95]" />
                  <span className="text-gray-400">No coding required</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-[#ff2d95]" />
                  <span className="text-gray-400">Instant liquidity</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-[#ff2d95]" />
                  <span className="text-gray-400">Fair price discovery</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Choose a meme-able name</li>
                <li>• Add a funny/trendy logo</li>
                <li>• Build community first</li>
                <li>• Hype it on Twitter/X</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}