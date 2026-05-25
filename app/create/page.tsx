"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Rocket,
  Upload,
  Image as ImageIcon,
  Coins,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
  Check,
  AlertCircle,
  Crown,
  Flame,
  PartyPopper,
} from "lucide-react";

export default function CreatePage() {
  const { connected } = useWallet();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenSupply, setTokenSupply] = useState("1,000,000");
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState("0.1");
  const [slippage, setSlippage] = useState("10");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isWhaleTier, setIsWhaleTier] = useState(false);

  useEffect(() => {
    const checkWhaleStatus = async () => {
      setIsWhaleTier(Math.random() > 0.7);
    };
    checkWhaleStatus();
  }, []);

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tokenName.trim()) newErrors.tokenName = "Token name is required";
    if (tokenName.length < 2) newErrors.tokenName = "Name too short (min 2)";
    if (tokenName.length > 32) newErrors.tokenName = "Name too long (max 32)";
    
    if (!tokenSymbol.trim()) newErrors.tokenSymbol = "Symbol is required";
    if (tokenSymbol.length < 2) newErrors.tokenSymbol = "Symbol too short (min 2)";
    if (tokenSymbol.length > 10) newErrors.tokenSymbol = "Symbol too long (max 10)";
    if (!/^[A-Za-z0-9]+$/.test(tokenSymbol)) newErrors.tokenSymbol = "Only letters and numbers";
    
    if (!tokenImage) newErrors.tokenImage = "Token image is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTokenImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateToken = async () => {
    if (!connected) {
      alert("Connect your wallet first fren!");
      return;
    }
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }, 3000);
  };

  const totalCost = isWhaleTier ? 0.5 : 0.1;
  const estimatedGas = 0.002;
  const total = totalCost + estimatedGas;

  return (
    <>
      
      
      <div className="relative z-10 min-h-screen">
        {/* Header - Pink Theme */}
        <div className="sticky top-0 z-50 border-b border-[oklch(51.8%_0.253_323.949)/0.2] bg-[#0A0A0F]/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl hover:bg-[oklch(51.8%_0.253_323.949)/0.1] transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 text-[#8E8E93] group-hover:text-[oklch(51.8%_0.253_323.949)]" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[oklch(51.8%_0.253_323.949)] to-[oklch(70%_0.25_150)] rounded-xl flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Create Meme Coin</h1>
                  <p className="text-xs text-[#8E8E93]">Launch on Solana in seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sol Taraf - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step Progress - Pink Theme */}
              <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6">
                <div className="flex items-center justify-between mb-6">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          step >= s 
                            ? "bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)] to-[oklch(70%_0.25_150)] text-white" 
                            : "bg-[#1C1C1E] text-[#8E8E93]"
                        }`}>
                          {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && (
                          <div className={`absolute top-1/2 -translate-y-1/2 w-full h-0.5 ${
                            step > s ? "bg-[oklch(51.8%_0.253_323.949)]" : "bg-[#252525]"
                          }`} style={{ left: "100%", width: "calc(100% - 2rem)" }} />
                        )}
                      </div>
                      <span className="ml-3 text-sm text-[#8E8E93] hidden sm:inline">
                        {s === 1 ? "Token Info" : s === 2 ? "Configure" : "Review"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Token Info */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#141414] rounded-2xl border border-[#252525] p-6 space-y-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-[oklch(51.8%_0.253_323.949)]" />
                    <h2 className="text-xl font-bold text-white">Token Information</h2>
                  </div>
                  
                  {/* Token Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Token Image *
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {imagePreview ? (
                          <div className="relative group">
                            <img
                              src={imagePreview}
                              alt="Token preview"
                              className="w-24 h-24 rounded-2xl object-cover border-2 border-[oklch(51.8%_0.253_323.949)]"
                            />
                            <button
                              onClick={() => {
                                setTokenImage(null);
                                setImagePreview(null);
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:scale-110 transition"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#252525] bg-[#0A0A0F] flex flex-col items-center justify-center cursor-pointer hover:border-[oklch(51.8%_0.253_323.949)] transition-all duration-200">
                            <Upload className="w-6 h-6 text-[#8E8E93]" />
                            <span className="text-xs text-[#8E8E93] mt-1">Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#8E8E93]">
                          PNG or JPG, max 2MB.<br />
                          Be creative fren! 🎨
                        </p>
                      </div>
                    </div>
                    {errors.tokenImage && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.tokenImage}
                      </p>
                    )}
                  </div>

                  {/* Token Name */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Token Name *
                    </label>
                    <input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g., Pink Whale Coin"
                      className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white placeholder-[#8E8E93] focus:outline-none focus:border-[oklch(51.8%_0.253_323.949)] transition-all duration-200"
                    />
                    {errors.tokenName && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.tokenName}
                      </p>
                    )}
                  </div>

                  {/* Token Symbol */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Token Symbol *
                    </label>
                    <input
                      type="text"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., PINK"
                      className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white placeholder-[#8E8E93] focus:outline-none focus:border-[oklch(51.8%_0.253_323.949)] transition-all duration-200 uppercase"
                    />
                    {errors.tokenSymbol && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.tokenSymbol}
                      </p>
                    )}
                  </div>

                  {/* Token Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={tokenDescription}
                      onChange={(e) => setTokenDescription(e.target.value)}
                      placeholder="Tell the community about your meme coin..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white placeholder-[#8E8E93] focus:outline-none focus:border-[oklch(51.8%_0.253_323.949)] transition-all duration-200 resize-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)] to-[oklch(70%_0.25_150)] text-white font-semibold hover:shadow-lg hover:shadow-[oklch(51.8%_0.253_323.949)/30] transition-all duration-200"
                  >
                    Continue →
                  </button>
                </motion.div>
              )}

              {/* Step 2: Configure */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#141414] rounded-2xl border border-[#252525] p-6 space-y-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-[oklch(51.8%_0.253_323.949)]" />
                    <h2 className="text-xl font-bold text-white">Configure Launch</h2>
                  </div>

                  {/* Total Supply */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Total Supply
                    </label>
                    <div className="relative">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                      <input
                        type="text"
                        value={tokenSupply}
                        onChange={(e) => setTokenSupply(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white focus:outline-none focus:border-[oklch(51.8%_0.253_323.949)] transition-all duration-200"
                      />
                    </div>
                    <p className="text-xs text-[#8E8E93] mt-1">Recommended: 1,000,000</p>
                  </div>

                  {/* Initial Buy Amount */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Initial Buy (SOL)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]">◎</span>
                      <input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        step="0.1"
                        min="0.1"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white focus:outline-none focus:border-[oklch(51.8%_0.253_323.949)] transition-all duration-200"
                      />
                    </div>
                    <p className="text-xs text-[#8E8E93] mt-1">Minimum: 0.1 SOL</p>
                  </div>

                  {/* Slippage */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Slippage Tolerance
                    </label>
                    <div className="flex gap-2">
                      {["5", "10", "15"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSlippage(s)}
                          className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                            slippage === s
                              ? "bg-[oklch(51.8%_0.253_323.949)] text-white"
                              : "bg-[#0A0A0F] text-[#8E8E93] border border-[#252525] hover:border-[oklch(51.8%_0.253_323.949)]"
                          }`}
                        >
                          {s}%
                        </button>
                      ))}
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-24 px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#252525] text-white text-center focus:outline-none focus:border-[oklch(51.8%_0.253_323.949)]"
                      />
                    </div>
                  </div>

                  {/* Whale Tier Banner - Pink Theme */}
                  {isWhaleTier && (
                    <div className="bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)/0.1] to-[oklch(70%_0.25_150)/0.1] rounded-xl p-4 border border-[oklch(51.8%_0.253_323.949)/0.3]">
                      <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8 text-[oklch(51.8%_0.253_323.949)]" />
                        <div>
                          <p className="font-semibold text-white">Pink Whale Tier Activated! 🐋</p>
                          <p className="text-sm text-[#8E8E93]">Premium benefits, lower fees, featured placement.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border border-[#252525] text-white hover:bg-[#1C1C1E] transition-all duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)] to-[oklch(70%_0.25_150)] text-white font-semibold hover:shadow-lg hover:shadow-[oklch(51.8%_0.253_323.949)/30] transition-all duration-200"
                    >
                      Review →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#141414] rounded-2xl border border-[#252525] p-6 space-y-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PartyPopper className="w-5 h-5 text-[oklch(51.8%_0.253_323.949)]" />
                    <h2 className="text-xl font-bold text-white">Review & Launch</h2>
                  </div>

                  {/* Token Preview */}
                  <div className="flex items-center gap-4 p-4 bg-[#0A0A0F] rounded-xl">
                    {imagePreview ? (
                      <img src={imagePreview} alt={tokenName} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#1C1C1E] flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-[#8E8E93]" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">{tokenName}</span>
                        <span className="text-sm text-[oklch(51.8%_0.253_323.949)]">({tokenSymbol})</span>
                      </div>
                      <p className="text-xs text-[#8E8E93] mt-1">{tokenDescription || "No description"}</p>
                    </div>
                  </div>

                  {/* Launch Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-[#252525]">
                      <span className="text-[#8E8E93]">Total Supply</span>
                      <span className="text-white font-medium">{tokenSupply}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#252525]">
                      <span className="text-[#8E8E93]">Initial Buy</span>
                      <span className="text-white font-medium">{buyAmount} SOL</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#252525]">
                      <span className="text-[#8E8E93]">Slippage</span>
                      <span className="text-white font-medium">{slippage}%</span>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-[#0A0A0F] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Launch Fee</span>
                      <span className="text-white">{totalCost} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Estimated Gas</span>
                      <span className="text-white">{estimatedGas} SOL</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#252525]">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-[oklch(51.8%_0.253_323.949)] font-bold">{total} SOL</span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Important</p>
                        <p className="text-xs text-[#8E8E93] mt-1">
                          Once launched, you cannot change token parameters. Double-check everything fren!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 rounded-xl border border-[#252525] text-white hover:bg-[#1C1C1E] transition-all duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateToken}
                      disabled={isLoading || !connected}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)] to-[oklch(70%_0.25_150)] text-white font-semibold hover:shadow-lg hover:shadow-[oklch(51.8%_0.253_323.949)/30] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Launching...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5" />
                          Launch Token
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Success State */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <div className="bg-[#141414] rounded-2xl border border-[oklch(51.8%_0.253_323.949)]/30 p-8 text-center max-w-md mx-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)] to-[oklch(70%_0.25_150)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Success! 🎉</h3>
                      <p className="text-[#8E8E93] mb-4">
                        Your meme coin has been created fren!
                      </p>
                      <p className="text-sm text-[oklch(51.8%_0.253_323.949)]">Redirecting to homepage...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sağ Taraf - Info Panel */}
            <div className="space-y-6">
              {/* Wallet Status */}
              <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6">
                <h3 className="font-semibold text-white mb-4">Wallet Status</h3>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${
                  connected ? "bg-[oklch(51.8%_0.253_323.949)/0.1] border border-[oklch(51.8%_0.253_323.949)/0.3]" : "bg-[#1C1C1E]"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${connected ? "bg-[oklch(51.8%_0.253_323.949)] animate-pulse" : "bg-red-500"}`} />
                  <span className="text-sm text-white">
                    {connected ? "Wallet Connected 🐋" : "Wallet Not Connected"}
                  </span>
                </div>
                {!connected && (
                  <p className="text-xs text-[#8E8E93] mt-3">
                    Connect your wallet to launch a meme coin!
                  </p>
                )}
              </div>

              {/* Info Cards */}
              <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0F] rounded-2xl border border-[#252525] p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
                  Launch Benefits
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
                    <span className="text-[#8E8E93]">No coding required</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
                    <span className="text-[#8E8E93]">Instant liquidity</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
                    <span className="text-[#8E8E93]">Auto Raydium migration</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
                    <span className="text-[#8E8E93]">Referral rewards</span>
                  </div>
                </div>
              </div>

              {/* Tips - Pink Theme */}
              <div className="bg-[#141414] rounded-2xl border border-[#252525] p-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
                  Meme Coin Tips
                </h3>
                <ul className="space-y-2 text-sm text-[#8E8E93]">
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
    </>
  );
}