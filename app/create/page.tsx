"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

// ─── Types ───────────────────────────────────────────────────────────────────

type CreateTokenResult = {
  success: boolean;
  error?: string;
  signature?: string;
  transaction?: string;
  mint?: string;
  genesisAccount?: string;
};

type PromoValidation = {
  valid: boolean;
  owner?: string;
  error?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreatePage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");

  // Promo validation state
  const [promoStatus, setPromoStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const promoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ─── Promo code validation (debounced 500ms) ──────────────────────────────

  const validatePromo = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      setPromoStatus("idle");
      return;
    }
    setPromoStatus("checking");
    try {
      const res = await fetch(`/api/promo/code?code=${encodeURIComponent(trimmed)}`);
      const data: PromoValidation = await res.json();
      setPromoStatus(data.valid ? "valid" : "invalid");
    } catch {
      setPromoStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (promoDebounceRef.current) clearTimeout(promoDebounceRef.current);
    promoDebounceRef.current = setTimeout(() => validatePromo(promoCode), 500);
    return () => {
      if (promoDebounceRef.current) clearTimeout(promoDebounceRef.current);
    };
  }, [promoCode, validatePromo]);

  // ─── Image handling ───────────────────────────────────────────────────────

  const handleImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!connected || !publicKey) {
      window.dispatchEvent(new CustomEvent("wallet-connect-requested"));
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      setError("Name and symbol are required");
      return;
    }
    if (!imageFile) {
      setError("Image is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Upload image
      setSubmitStep("Uploading image…");
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.url) throw new Error(uploadData.error ?? "Image upload failed");
      const imageUrl: string = uploadData.url;

      // Step 2: Build token transaction
      setSubmitStep("Building transaction…");
      const createRes = await fetch("/api/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          symbol: slugify(symbol),
          description: desc.trim(),
          imageUrl,
          creatorWallet: publicKey.toString(),
          promoCode: promoCode.trim().toUpperCase() || undefined,
        }),
      });
      const createData: CreateTokenResult = await createRes.json();
      if (!createData.success) throw new Error(createData.error ?? "Token creation failed");

      const rawTx = createData.transaction ?? createData.signature;
      if (!rawTx) throw new Error("No transaction returned from server");
      const { mint, genesisAccount } = createData;

      // Step 3: Sign & send
      setSubmitStep("Awaiting wallet signature…");
      const txBytes = Buffer.from(rawTx, "base64");
      let tx: VersionedTransaction | Transaction;
      try {
        tx = VersionedTransaction.deserialize(txBytes);
      } catch {
        tx = Transaction.from(txBytes);
      }

      let sig: string;
      try {
        sig = await sendTransaction(tx as VersionedTransaction, connection);
      } catch (walletErr) {
        const msg = walletErr instanceof Error ? walletErr.message : "Wallet rejected";
        throw new Error(msg);
      }

      setSubmitStep("Confirming…");
      const { value: status } = await connection.confirmTransaction(sig, "confirmed");
      if (status.err) throw new Error("Transaction failed on-chain");

      // Step 4: Track launch → DEX listing (non-fatal)
      if (genesisAccount && mint) {
        setSubmitStep("Listing on DEX…");
        fetch("/api/track-launch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genesisAccount,
            mint,
            name: name.trim(),
            symbol: slugify(symbol),
            imageUrl,
            creatorWallet: publicKey.toString(),
            signature: sig,
          }),
        }).catch(() => console.warn("track-launch failed — DEX listing may be delayed"));
      }

      // Step 5: Unlock referral code for creator (non-fatal)
      fetch("/api/generate-promocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toString() }),
      }).catch(() => console.warn("generate-promocode failed"));

      // Done
      setSuccess(true);
      setSubmitStep("");
      setTimeout(() => {
        router.push(genesisAccount ? `/dex?token=${genesisAccount}` : "/dex");
      }, 1500);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      setSubmitStep("");
    } finally {
      setIsSubmitting(false);
    }
  }, [connected, publicKey, sendTransaction, connection, router, name, symbol, desc, imageFile, promoCode]);

  // ─── Promo indicator ─────────────────────────────────────────────────────

  const promoIndicator = useMemo(() => {
    if (!promoCode.trim()) return null;
    if (promoStatus === "checking") return <span className="text-yellow-400 text-xs">Checking…</span>;
    if (promoStatus === "valid")    return <span className="text-green-400 text-xs">✓ Valid — referrer earns 0.05 SOL</span>;
    if (promoStatus === "invalid")  return <span className="text-red-400 text-xs">✗ Invalid code</span>;
    return null;
  }, [promoCode, promoStatus]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Token</h1>
          <p className="text-gray-500 text-sm mt-1">Launch fee: 0.15 SOL</p>
        </div>

        {/* Image upload */}
        <div
          className="border-2 border-dashed border-gray-700 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => document.getElementById("img-input")?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImage(f); }}
        >
          {imagePreview
            ? <img src={imagePreview} alt="preview" className="w-24 h-24 rounded-xl object-cover" />
            : <div className="w-24 h-24 rounded-xl bg-gray-800 flex items-center justify-center text-gray-600 text-3xl">🖼</div>
          }
          <span className="text-gray-500 text-sm">Click or drag image (max 5MB)</span>
          <input
            id="img-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
            placeholder="My Coin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
          />
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Symbol</label>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors uppercase"
            placeholder="MYCOIN"
            value={symbol}
            onChange={(e) => setSymbol(slugify(e.target.value))}
            maxLength={8}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Description <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors resize-none"
            placeholder="Tell the world about your token…"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={280}
          />
        </div>

        {/* Promo code */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Referral Code <span className="text-gray-600">(optional)</span>
          </label>
          <input
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none uppercase transition-colors ${
              promoStatus === "valid"   ? "border-green-600 focus:border-green-500" :
              promoStatus === "invalid" ? "border-red-700 focus:border-red-600" :
                                         "border-gray-700 focus:border-gray-500"
            }`}
            placeholder="ENTER CODE"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            maxLength={12}
          />
          <div className="mt-1.5 h-4">{promoIndicator}</div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/60 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-950/60 border border-green-800 rounded-lg px-4 py-3 text-green-300 text-sm">
            🎉 Token created! Heading to DEX…
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || success}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 text-base hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? (submitStep || "Processing…")
            : "Launch Token — 0.15 SOL"
          }
        </button>

        {!connected && (
          <p className="text-center text-gray-600 text-sm">Connect your wallet to continue</p>
        )}
      </div>
    </div>
  );
}