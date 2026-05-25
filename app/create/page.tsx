"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createAndRegisterLaunch } from "@metaplex-foundation/genesis";
import { genesis } from "@metaplex-foundation/genesis";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Rocket, Upload, Shield, Check, AlertCircle,
  Flame, PartyPopper, ExternalLink, Copy, Loader2, ImageIcon,
} from "lucide-react";

const CREATE_FEE_SOL = 0.01;
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

    try {
      // 1. FEE ÖDE
      const tx = new Transaction();
      const totalLamports = Math.floor(CREATE_FEE_SOL * 1_000_000_000);
      for (const dist of FEE_DISTRIBUTION) {
        const amount = Math.floor((totalLamports * dist.percentage) / 100);
        if (amount > 0) {
          tx.add(SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(dist.address),
            lamports: amount,
          }));
        }
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const feeSig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: feeSig, blockhash, lastValidBlockHeight }, "confirmed");

      // 2. TOKEN OLUŞTUR
      const umi = createUmi(connection.rpcEndpoint).use(genesis());
      umi.use(walletAdapterIdentity(wallet.adapter));
      const result = await createAndRegisterLaunch(umi, {}, {
        wallet: publicKey.toString(),
        launchType: "bondingCurve",
        token: {
          name: tokenName,
          symbol: tokenSymbol,
          image: uploadedImageUrl,
          description: tokenDescription || "",
        },
        launch: { creatorFeeWallet: BONDING_CURVE_FEE_WALLET },
      } as any);

      // 3. KAYDET
      await fetch("/api/track-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mintAddress: result.mintAddress,
          name: tokenName,
          symbol: tokenSymbol,
          imageUrl: uploadedImageUrl,
          userPublicKey: publicKey.toString(),
          signature: feeSig,
        }),
      });

      setMintAddress(result.mintAddress);
      setLaunchLink(result.launch?.link || null);
      setSuccess(true);
    } catch (err: any) {
      if (err.message?.includes("rejected") || err.message?.includes("User rejected")) {
        setError("Transaction cancelled");
      } else {
        setError(err.message || "Something went wrong");
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

  return (
    <div className="relative z-10 min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[#1A1A1A] bg-[#0A0A0F]/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
            className="p-2 rounded-xl hover:bg-white/5 transition group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff2d95] to-[#ff6bcb] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff2d95]/20">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Create Token</h1>
              <p className="text-xs text-gray-600 mt-0.5">Bonding curve launch · 0.01 SOL</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium transition ${
                  i === step ? "text-[#ff2d95]" : i < step ? "text-green-400" : "text-gray-600"
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                    i < step
                      ? "bg-green-500/20 text-green-400"
                      : i === step
                      ? "bg-[#ff2d95]/20 text-[#ff2d95]"
                      : "bg-white/5 text-gray-600"
                  }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px transition ${i < step ? "bg-green-500/40" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* STEP 0 — Info */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="bg-[#111111] rounded-2xl border border-[#1E1E1E] p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#ff2d95]" />
                  <h2 className="text-lg font-bold text-white">Token Info</h2>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Token Image *</label>
                  <div className="flex items-start gap-5">
                    <label className={`relative w-24 h-24 rounded-2xl overflow-hidden cursor-pointer group flex-shrink-0 border-2 transition ${
                      errors.image ? "border-red-500/50" : imagePreview ? "border-[#ff2d95]/40" : "border-dashed border-[#2A2A2A] hover:border-[#ff2d95]/40"
                    }`}>
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#0D0D0D] flex flex-col items-center justify-center gap-2">
                          {uploadingImage ? (
                            <Loader2 className="w-5 h-5 text-[#ff2d95] animate-spin" />
                          ) : (
                            <>
                              <ImageIcon className="w-6 h-6 text-gray-600" />
                              <span className="text-[10px] text-gray-600">Upload</span>
                            </>
                          )}
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP</p>
                      <p className="text-xs text-gray-600">Max 5MB. Square images work best.</p>
                      {uploadedImageUrl && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-xs text-green-500">Uploaded to Arweave</span>
                        </div>
                      )}
                      {uploadingImage && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Loader2 className="w-3 h-3 text-[#ff2d95] animate-spin" />
                          <span className="text-xs text-gray-500">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.image && <p className="text-xs text-red-400 mt-2">{errors.image}</p>}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Token Name *</label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. Pink Whale"
                    maxLength={32}
                    className={`w-full px-4 py-3 rounded-xl bg-[#0D0D0D] border text-white placeholder-gray-700 focus:outline-none focus:border-[#ff2d95] transition text-sm ${
                      errors.name ? "border-red-500/50" : "border-[#1E1E1E]"
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.name ? <p className="text-xs text-red-400">{errors.name}</p> : <span />}
                    <span className="text-xs text-gray-700">{tokenName.length}/32</span>
                  </div>
                </div>

                {/* Symbol */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Symbol *</label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    placeholder="e.g. PINK"
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-xl bg-[#0D0D0D] border text-white placeholder-gray-700 focus:outline-none focus:border-[#ff2d95] transition text-sm font-mono tracking-widest ${
                      errors.symbol ? "border-red-500/50" : "border-[#1E1E1E]"
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.symbol ? <p className="text-xs text-red-400">{errors.symbol}</p> : <span />}
                    <span className="text-xs text-gray-700">{tokenSymbol.length}/10</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description <span className="text-gray-700">(optional)</span></label>
                  <textarea
                    value={tokenDescription}
                    onChange={(e) => setTokenDescription(e.target.value)}
                    placeholder="Tell the community about your token..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] text-white placeholder-gray-700 focus:outline-none focus:border-[#ff2d95] transition text-sm resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-700">{tokenDescription.length}/500</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { if (validate()) setStep(1); }}
                disabled={uploadingImage}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-[#ff2d95]/20"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 1 — Review */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="bg-[#111111] rounded-2xl border border-[#1E1E1E] p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-[#ff2d95]" />
                  <h2 className="text-lg font-bold text-white">Review & Confirm</h2>
                </div>

                {/* Token Preview */}
                <div className="flex items-center gap-4 p-4 bg-[#0D0D0D] rounded-xl border border-[#1A1A1A]">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-16 h-16 rounded-xl object-cover border border-[#ff2d95]/20" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-700" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">{tokenName}</span>
                      <span className="text-sm text-[#ff2d95] font-mono font-bold">${tokenSymbol}</span>
                    </div>
                    {tokenDescription && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tokenDescription}</p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2.5 border-b border-[#1A1A1A]">
                    <span className="text-gray-500">Launch type</span>
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ff2d95]" />
                      Bonding Curve
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-[#1A1A1A]">
                    <span className="text-gray-500">Platform fee</span>
                    <span className="text-white font-medium">0.01 SOL</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-[#1A1A1A]">
                    <span className="text-gray-500">Network</span>
                    <span className="text-white font-medium">Solana Mainnet</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500">Image storage</span>
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Arweave (permanent)
                    </span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-3 p-4 bg-[#ff2d95]/5 rounded-xl border border-[#ff2d95]/15">
                  <Shield className="w-5 h-5 text-[#ff2d95] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Bonding curve launch</p>
                    <p className="text-xs text-gray-500 mt-0.5">Price increases automatically with each purchase. Fair launch, no pre-sale.</p>
                  </div>
                </div>

                {/* Wallet status */}
                {!connected && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">Connect your wallet to continue</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-4 rounded-2xl border border-[#1E1E1E] text-gray-400 font-medium text-sm hover:bg-white/5 hover:text-white transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => { setStep(2); handleCreate(); }}
                  disabled={!connected}
                  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-bold text-sm hover:opacity-90 disabled:opacity-40 transition shadow-lg shadow-[#ff2d95]/20 flex items-center justify-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Launch Token · 0.01 SOL
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Launching */}
          {step === 2 && !success && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#ff2d95]/10 border border-[#ff2d95]/20 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-[#ff2d95]" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#ff2d95]/30 animate-ping" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Launching...</h3>
                <p className="text-sm text-gray-500">Confirm transactions in your wallet</p>
              </div>
              {error && (
                <div className="w-full max-w-md bg-red-500/10 rounded-xl p-4 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400">{error}</p>
                    <button
                      onClick={() => { setStep(1); setError(""); }}
                      className="text-xs text-red-400/70 hover:text-red-400 mt-1 underline"
                    >
                      Go back and try again
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SUCCESS */}
          {success && mintAddress && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 py-12"
            >
              {/* Confetti effect */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff2d95] to-[#ff6bcb] flex items-center justify-center shadow-2xl shadow-[#ff2d95]/30">
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </div>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="absolute inset-0 rounded-full border border-[#ff2d95]/30"
                  />
                ))}
              </div>

              <div className="text-center">
                <h2 className="text-3xl font-black text-white mb-2">Token is Live! 🎉</h2>
                <p className="text-gray-500 text-sm">
                  <span className="text-[#ff2d95] font-bold">${tokenSymbol}</span> is now on the bonding curve
                </p>
              </div>

              {/* Mint address */}
              <div className="w-full max-w-md bg-[#111111] rounded-2xl border border-[#1E1E1E] p-5">
                <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wider">Mint Address</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-xs text-[#ff2d95] font-mono break-all leading-relaxed">
                    {mintAddress}
                  </code>
                  <button
                    onClick={copyMint}
                    className="p-2 rounded-lg hover:bg-white/5 transition flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full max-w-md space-y-3">
                <button
                  onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, "_blank")}
                  className="w-full py-3.5 rounded-xl border border-[#1E1E1E] text-white text-sm font-medium hover:bg-white/5 transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  View on Solscan
                </button>
                {launchLink && (
                  <button
                    onClick={() => window.open(launchLink, "_blank")}
                    className="w-full py-3.5 rounded-xl border border-[#ff2d95]/30 text-[#ff2d95] text-sm font-medium hover:bg-[#ff2d95]/5 transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Genesis
                  </button>
                )}
                <button
                  onClick={() => router.push("/dex")}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white text-sm font-bold hover:opacity-90 transition shadow-lg shadow-[#ff2d95]/20"
                >
                  Trade on DEX →
                </button>
                <button
                  onClick={() => {
                    setStep(0); setSuccess(false); setTokenName(""); setTokenSymbol("");
                    setTokenDescription(""); setImagePreview(null); setUploadedImageUrl(null);
                    setMintAddress(null); setLaunchLink(null);
                  }}
                  className="w-full py-3 text-gray-600 text-sm hover:text-gray-400 transition"
                >
                  Create another token
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}