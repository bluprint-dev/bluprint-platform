"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useToast } from "../components/ToastProvider";

export default function CreatePage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!connected) {
      showToast("Connect wallet first", "warning");
      return;
    }
    if (!name || !symbol || !logo) {
      showToast("Fill all fields", "warning");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("symbol", symbol);
    formData.append("logo", logo);
    formData.append("userPublicKey", publicKey!.toString());

    try {
      const res = await fetch("/api/create-token", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ Token created! Launching on bonding curve...", "success");
        router.push("/");
      } else {
        showToast(`❌ ${data.error}`, "error");
      }
    } catch (err: any) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-purple-900/30 to-black" />
        
        <div className="relative z-10 pt-20 sm:pt-24 max-w-md mx-auto px-4 pb-16">
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
            <h1 className="text-2xl font-bold text-white text-center mb-6">
              🚀 Create Token
            </h1>
            <p className="text-gray-400 text-sm text-center mb-6">
              Your token will launch on bonding curve. Only network fee applies.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Token Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Awesome Token"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Token Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., MAT"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogo(e.target.files?.[0] || null)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white file:mr-2 file:py-1 file:px-3 file:rounded-lg file:bg-blue-600 file:text-white file:border-0"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition transform hover:scale-105 mt-4"
              >
                {loading ? "Creating..." : "✨ Create Token"}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}