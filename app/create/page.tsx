"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Transaction,
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface FormState {
  name: string;
  symbol: string;
  description: string;
  website: string;
  twitter: string;
  telegram: string;
  promoCode: string;
}

type PromoStatus = "idle" | "checking" | "valid" | "invalid";
type LaunchStatus =
  | "idle"
  | "uploading"
  | "creating"
  | "signing"
  | "confirming"
  | "done"
  | "error";

const CREATION_FEE_SOL = 0.05;
const PLATFORM_WALLET = new PublicKey("A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X");

/* ─── Rotating Globe ─────────────────────────────────────────────────────── */
function RotatingGlobe() {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
      pointerEvents: "none", overflow: "hidden",
    }}>
      <div style={{
        width: 500, height: 500, borderRadius: "50%",
        border: "1px solid rgba(153,69,255,0.08)",
        position: "relative",
        animation: "globe-spin 30s linear infinite",
        opacity: 0.4,
      }}>
        {[0, 30, 60, 90, 120, 150].map((deg, i) => (
          <div key={i} style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1px solid rgba(153,69,255,0.15)",
            transform: `rotateY(${deg}deg)`,
          }} />
        ))}
        {[20, 40, 60, 80].map((pct, i) => (
          <div key={i} style={{
            position: "absolute", left: 0, right: 0,
            top: `${pct}%`, height: "1px",
            background: "rgba(153,69,255,0.12)", borderRadius: 1,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Bonding Curve Bar ──────────────────────────────────────────────────── */
function BondingCurveBar({ pct }: { pct: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.08em" }}>
          BONDING CURVE
        </span>
        <span style={{ fontSize: 11, color: "#14F195", fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #9945FF, #14F195)",
          borderRadius: 99, transition: "width 0.6s ease",
          boxShadow: "0 0 12px rgba(20,241,149,0.6)",
        }} />
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function CreatePage() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [form, setForm] = useState<FormState>({
    name: "", symbol: "", description: "",
    website: "", twitter: "", telegram: "", promoCode: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [socialOpen, setSocialOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus>("idle");
  const [launchError, setLaunchError] = useState("");
  const [txSig, setTxSig] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  }, [handleImage]);

  /* ── promo code validation ── */
  useEffect(() => {
    if (!form.promoCode || form.promoCode.length < 4) {
      setPromoStatus("idle");
      return;
    }
    if (promoDebounceRef.current) clearTimeout(promoDebounceRef.current);
    setPromoStatus("checking");
    promoDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/promo/code?code=${form.promoCode.toUpperCase()}`);
        const json = await res.json();
        setPromoStatus(json.valid ? "valid" : "invalid");
      } catch {
        setPromoStatus("invalid");
      }
    }, 500);
  }, [form.promoCode]);

  /* ─────────────────────────────────────────────────────────────────────────
     FIXED handleLaunch
     Doğru akış:
       1. Görsel → Pinata  (/api/upload)
       2. Metadata JSON → Irys  (/api/irys/upload)
       3. Token + Bonding Curve oluştur  (/api/bonding-curve/launch)  ← server-side, platform wallet imzalar
       4. Kullanıcı 0.05 SOL gönderir  (tek kullanıcı TX)
       5. Redis + referral kaydet  (/api/track-launch)
       6. Promo kodu işle  (/api/generate-promocode)
  ───────────────────────────────────────────────────────────────────────── */
  const handleLaunch = async () => {
    if (!connected || !publicKey || !signTransaction) return;
    if (!form.name.trim() || !form.symbol.trim()) return;

    setLaunchStatus("uploading");
    setLaunchError("");
    setTxSig("");

    try {
      // ── ADIM 1: Görsel → Pinata ──────────────────────────────────────────
      let imageUrl = "";
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = await upRes.json();
        // Pinata endpoint imageUrl döndürüyor (url değil)
        if (!upJson.imageUrl) throw new Error("Image upload failed: " + (upJson.error || "unknown"));
        imageUrl = upJson.imageUrl;
      }

      setLaunchStatus("creating");

      // ── ADIM 2: Metadata JSON → Irys ─────────────────────────────────────
      const metaRes = await fetch("/api/irys/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          symbol: form.symbol.trim().toUpperCase(),
          description: form.description.trim() || `${form.name.trim()} token on BluPrint`,
          imageUrl,
          website: form.website.trim(),
          twitter: form.twitter.trim(),
          telegram: form.telegram.trim(),
        }),
      });
      const metaJson = await metaRes.json();
      if (!metaJson.success || !metaJson.uri) {
        throw new Error("Metadata upload failed: " + (metaJson.error || "unknown"));
      }
      const metadataUri = metaJson.uri;

      // ── ADIM 3: Token + Bonding Curve oluştur (server-side) ──────────────
      // Platform wallet server'da imzalar, kullanıcı görmez
      const launchRes = await fetch("/api/bonding-curve/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          symbol: form.symbol.trim().toUpperCase(),
          image: metadataUri,          // Irys URI → Genesis SDK bunu metadata olarak kullanır
          description: form.description.trim(),
          website: form.website.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
          telegram: form.telegram.trim() || undefined,
        }),
      });
      const launchJson = await launchRes.json();
      if (!launchJson.success) {
        throw new Error("Token creation failed: " + (launchJson.error || launchJson.type || "unknown"));
      }

      const { mintAddress, genesisAccount } = launchJson;

      // ── ADIM 4: Kullanıcı 0.05 SOL gönderir (tek kullanıcı TX) ──────────
      setLaunchStatus("signing");

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

      const feeTx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PLATFORM_WALLET,
          lamports: Math.round(CREATION_FEE_SOL * LAMPORTS_PER_SOL),
        })
      );

      const signedFeeTx = await signTransaction(feeTx);
      setLaunchStatus("confirming");

      const sig = await connection.sendRawTransaction(signedFeeTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      // ── ADIM 5: Redis + referral kaydet ──────────────────────────────────
      fetch("/api/track-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mintAddress,
          genesisAccount,
          name: form.name.trim(),
          symbol: form.symbol.trim().toUpperCase(),
          imageUrl,
          userPublicKey: publicKey.toBase58(),
          signature: sig,
        }),
      }).catch(() => {});

      // ── ADIM 6: Referral sistemi → promo kodu oluştur ───────────────────
      // Referral kodu varsa create-token endpoint'ine bildir
      if (promoStatus === "valid" && form.promoCode) {
        fetch("/api/create-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature: sig,
            userPublicKey: publicKey.toBase58(),
            tokenData: {
              name: form.name.trim(),
              symbol: form.symbol.trim().toUpperCase(),
            },
            promoCode: form.promoCode.toUpperCase(),
          }),
        }).catch(() => {});
      }

      // Kullanıcıya promo kodu oluştur
      fetch("/api/generate-promocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      }).catch(() => {});

      setTxSig(sig);
      setLaunchStatus("done");

    } catch (err: any) {
      console.error("Launch error:", err);
      setLaunchError(err?.message || "Unknown error");
      setLaunchStatus("error");
    }
  };

  const isLaunching = (["uploading", "creating", "signing", "confirming"] as LaunchStatus[]).includes(launchStatus);
  const isDone = launchStatus === "done";
  const launchLabel: Record<LaunchStatus, string> = {
    idle: "LAUNCH TOKEN",
    uploading: "UPLOADING IMAGE...",
    creating: "CREATING TOKEN...",
    signing: "WAITING FOR SIGNATURE...",
    confirming: "CONFIRMING ON-CHAIN...",
    done: "🚀 LAUNCHED!",
    error: "TRY AGAIN",
  };

  const promoIndicator = {
    idle: null,
    checking: <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>checking...</span>,
    valid: <span style={{ color: "#14F195", fontSize: 12, fontWeight: 600 }}>✓ Valid code</span>,
    invalid: <span style={{ color: "#ff6b6b", fontSize: 12 }}>✗ Invalid code</span>,
  }[promoStatus];

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0F0817 0%, #1a0b2e 50%, #2d124d 100%)", fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        .gl-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(153,69,255,0.2); border-radius: 12px; color: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 15px; padding: 14px 18px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; resize: none; }
        .gl-input::placeholder { color: rgba(255,255,255,0.2); }
        .gl-input:focus { border-color: rgba(153,69,255,0.7); box-shadow: 0 0 0 3px rgba(153,69,255,0.12), 0 0 20px rgba(153,69,255,0.08); }
        .gl-input.valid:focus { border-color: rgba(20,241,149,0.6); box-shadow: 0 0 0 3px rgba(20,241,149,0.1); }
        .gl-label { display: block; color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
        .glass-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(153,69,255,0.18); border-radius: 20px; }
        .drop-zone { border: 1.5px dashed rgba(153,69,255,0.35); border-radius: 14px; padding: 32px 20px; text-align: center; cursor: pointer; transition: all 0.25s; background: rgba(153,69,255,0.04); position: relative; overflow: hidden; }
        .drop-zone:hover, .drop-zone.dragging { border-color: rgba(153,69,255,0.7); background: rgba(153,69,255,0.08); box-shadow: 0 0 24px rgba(153,69,255,0.12); }
        .launch-btn { width: 100%; padding: 18px; border: none; border-radius: 14px; background: linear-gradient(135deg, #14F195 0%, #0ea06a 100%); color: #0F0817; font-family: 'Orbitron', monospace; font-size: 16px; font-weight: 900; letter-spacing: 0.1em; cursor: pointer; transition: all 0.25s; position: relative; overflow: hidden; }
        .launch-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); opacity: 0; transition: opacity 0.2s; }
        .launch-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(20,241,149,0.4), 0 0 60px rgba(20,241,149,0.15); }
        .launch-btn:hover::before { opacity: 1; }
        .launch-btn:active { transform: translateY(0) scale(0.99); }
        .launch-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .launch-btn.done { background: linear-gradient(135deg, #9945FF, #14F195); }
        .launch-btn.error { background: linear-gradient(135deg, #ff6b6b, #cc3333); }
        .preview-card { background: rgba(15,8,23,0.85); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border-radius: 24px; position: relative; overflow: hidden; padding: 2px; }
        .preview-card::before { content: ''; position: absolute; inset: 0; border-radius: 24px; padding: 2px; background: linear-gradient(135deg, #9945FF, #14F195, #9945FF); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; background-size: 200% 200%; animation: border-flow 4s linear infinite; }
        @keyframes border-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .preview-inner { background: rgba(15,8,23,0.95); border-radius: 22px; padding: 28px; position: relative; z-index: 1; }
        .ticker-badge { display: inline-block; background: rgba(153,69,255,0.15); border: 1px solid rgba(153,69,255,0.35); border-radius: 20px; padding: 4px 14px; font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 700; color: #9945FF; letter-spacing: 0.1em; }
        .placeholder-anim { width: 100%; aspect-ratio: 1; border-radius: 16px; background: rgba(153,69,255,0.08); border: 1px solid rgba(153,69,255,0.15); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .placeholder-anim::before { content: ''; position: absolute; width: 200%; height: 200%; background: conic-gradient(transparent 0deg, rgba(153,69,255,0.15) 60deg, rgba(20,241,149,0.1) 120deg, transparent 180deg); animation: spin-slow 8s linear infinite; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .matrix-text { font-family: 'Orbitron', monospace; font-size: 11px; color: rgba(153,69,255,0.5); letter-spacing: 0.15em; animation: matrix-flicker 3s ease-in-out infinite; }
        @keyframes matrix-flicker { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; color: rgba(20,241,149,0.7); } }
        @keyframes globe-spin { to { transform: rotate(360deg); } }
        .accordion-trigger { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 12px 0; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; user-select: none; border-top: 1px solid rgba(153,69,255,0.1); transition: color 0.2s; }
        .accordion-trigger:hover { color: rgba(255,255,255,0.8); }
        .accordion-chevron { transition: transform 0.3s; font-size: 16px; }
        .accordion-chevron.open { transform: rotate(180deg); }
        .fee-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(20,241,149,0.06); border: 1px solid rgba(20,241,149,0.2); border-radius: 10px; padding: 8px 16px; font-size: 13px; color: rgba(20,241,149,0.8); font-weight: 600; }
        .mesh-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .mesh-blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.08; }
        .glow-text-green { text-shadow: 0 0 24px rgba(20,241,149,0.5); }
        .glow-text-purple { text-shadow: 0 0 24px rgba(153,69,255,0.6); }
        @keyframes success-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .success-icon { animation: success-pulse 1.5s ease-in-out infinite; }
        @media (max-width: 768px) { .layout-grid { grid-template-columns: 1fr !important; } .right-col { position: static !important; } }
      `}</style>

      {/* Background blobs */}
      <div className="mesh-bg">
        <div className="mesh-blob" style={{ width: 700, height: 700, background: "#9945FF", top: -200, left: -200 }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, background: "#14F195", bottom: -100, right: -100 }} />
        <div className="mesh-blob" style={{ width: 400, height: 400, background: "#9945FF", top: "40%", right: "20%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/favicon.ico" alt="BluPrint Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(153,69,255,0.6))" }} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 900, color: "#fff" }}>BluPrint</span>
          </div>
          <WalletMultiButton style={{ background: "rgba(153,69,255,0.12)", border: "1px solid rgba(153,69,255,0.35)", borderRadius: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }} />
        </div>

        {/* Success screen */}
        {launchStatus === "done" ? (
          <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
            <div className="success-icon" style={{ fontSize: 64, marginBottom: 24 }}>🚀</div>
            <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 32, fontWeight: 900, color: "#14F195", margin: "0 0 16px" }} className="glow-text-green">
              Token Launched!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: "0 0 8px" }}>
              <strong style={{ color: "#fff" }}>{form.name}</strong> (${form.symbol.toUpperCase()}) is live on the bonding curve.
            </p>
            {txSig && (
              <a href={`https://solscan.io/tx/${txSig}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#9945FF", fontSize: 13, display: "block", margin: "16px 0 32px", wordBreak: "break-all" }}>
                View on Solscan ↗
              </a>
            )}
            <button className="launch-btn" style={{ maxWidth: 280, margin: "0 auto" }}
              onClick={() => {
                setLaunchStatus("idle");
                setForm({ name: "", symbol: "", description: "", website: "", twitter: "", telegram: "", promoCode: "" });
                setImageFile(null);
                setImagePreview("");
                setTxSig("");
              }}>
              LAUNCH ANOTHER
            </button>
          </div>
        ) : (
          <div className="layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 32, alignItems: "start" }}>

            {/* ── LEFT COLUMN ── */}
            <div>
              <div style={{ marginBottom: 36 }}>
                <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#fff", margin: "0 0 12px", lineHeight: 1.1 }}>
                  Launch Your <span style={{ color: "#14F195" }} className="glow-text-green">BluPrint</span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: 0, maxWidth: 460, lineHeight: 1.6 }}>
                  Fill in the details to deploy your token onto the bonding curve instantly.
                </p>
              </div>

              <div className="glass-card" style={{ padding: 32 }}>

                {/* Token Name */}
                <div style={{ marginBottom: 20 }}>
                  <label className="gl-label">Token Name</label>
                  <input className="gl-input" placeholder='e.g. "Solana Doge"' value={form.name} onChange={set("name")} maxLength={32} />
                </div>

                {/* Symbol */}
                <div style={{ marginBottom: 20 }}>
                  <label className="gl-label">Ticker / Symbol</label>
                  <input className="gl-input" placeholder='e.g. "SDOGE"' value={form.symbol}
                    onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase().slice(0, 10) }))} maxLength={10} />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 24 }}>
                  <label className="gl-label">Description</label>
                  <textarea className="gl-input" placeholder="The meme lore, the story, the vision..." value={form.description} onChange={set("description")} rows={4} maxLength={500} style={{ resize: "vertical" }} />
                </div>

                {/* Image Upload */}
                <div style={{ marginBottom: 24 }}>
                  <label className="gl-label">Token Image / Logo</label>
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }}
                    onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
                  {imagePreview ? (
                    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
                      <img src={imagePreview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block", borderRadius: 14 }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", borderRadius: 14 }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`drop-zone${isDragging ? " dragging" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}>
                      <div style={{ marginBottom: 12 }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9945FF" strokeWidth={1.5} style={{ opacity: 0.7 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 4px" }}>
                        Drag & drop or <span style={{ color: "#9945FF", fontWeight: 600 }}>browse</span>
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>PNG, JPG, GIF, WebP — recommended 500×500</p>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div style={{ marginBottom: 20 }}>
                  <div className="accordion-trigger" onClick={() => setSocialOpen(o => !o)}>
                    <span>Social Links (Optional)</span>
                    <span className={`accordion-chevron${socialOpen ? " open" : ""}`}>▾</span>
                  </div>
                  {socialOpen && (
                    <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                      {[
                        { key: "website", placeholder: "https://yourtoken.xyz", label: "Website" },
                        { key: "twitter", placeholder: "https://x.com/yourtoken", label: "X / Twitter" },
                        { key: "telegram", placeholder: "https://t.me/yourtoken", label: "Telegram" },
                      ].map(({ key, placeholder, label }) => (
                        <div key={key}>
                          <label className="gl-label">{label}</label>
                          <input className="gl-input" placeholder={placeholder} value={form[key as keyof FormState]} onChange={set(key as keyof FormState)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Promo Code */}
                <div style={{ marginBottom: 28 }}>
                  <div className="accordion-trigger" onClick={() => setPromoOpen(o => !o)}>
                    <span>Promo / Referral Code (Optional)</span>
                    <span className={`accordion-chevron${promoOpen ? " open" : ""}`}>▾</span>
                  </div>
                  {promoOpen && (
                    <div style={{ paddingTop: 16 }}>
                      <div style={{ position: "relative" }}>
                        <input className={`gl-input${promoStatus === "valid" ? " valid" : ""}`}
                          placeholder="Enter code (e.g. ABC1234)"
                          value={form.promoCode}
                          onChange={e => setForm(f => ({ ...f, promoCode: e.target.value.toUpperCase().slice(0, 12) }))}
                          style={{ paddingRight: 120 }} />
                        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                          {promoIndicator}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fee + Launch */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="fee-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                      </svg>
                      Creation Fee: {CREATION_FEE_SOL} SOL
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(20,241,149,0.6)", fontWeight: 600, paddingLeft: 4 }}>
                      🎯 Special launch price for the first 100 users only!
                    </span>
                  </div>
                  {!connected && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Connect wallet to launch</span>}
                </div>

                <button
                  className={`launch-btn${isDone ? " done" : ""}${launchStatus === "error" ? " error" : ""}`}
                  onClick={handleLaunch}
                  disabled={isLaunching || !connected || !form.name.trim() || !form.symbol.trim()}>
                  {isLaunching && (
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#0F0817", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite", marginRight: 10, verticalAlign: "middle" }} />
                  )}
                  {launchLabel[launchStatus]}
                </button>

                {launchStatus === "error" && launchError && (
                  <p style={{ color: "#ff6b6b", fontSize: 13, margin: "12px 0 0", textAlign: "center" }}>
                    {launchError}
                  </p>
                )}

                {!connected && (
                  <div style={{ marginTop: 14, textAlign: "center" }}>
                    <WalletMultiButton style={{ background: "rgba(153,69,255,0.12)", border: "1px solid rgba(153,69,255,0.35)", borderRadius: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, width: "100%", justifyContent: "center" }} />
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN — Live Preview ── */}
            <div className="right-col" style={{ position: "sticky", top: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 8px #14F195", animation: "matrix-flicker 1.5s ease-in-out infinite" }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  Live Preview
                </span>
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -60, zIndex: 0, opacity: 0.5 }}>
                  <RotatingGlobe />
                </div>
                <div className="preview-card" style={{ position: "relative", zIndex: 1 }}>
                  <div className="preview-inner">
                    <div style={{ marginBottom: 20 }}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="token" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 16, display: "block" }} />
                      ) : (
                        <div className="placeholder-anim">
                          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 28, fontWeight: 900, color: "rgba(153,69,255,0.4)", marginBottom: 8 }}>BP</div>
                            <div className="matrix-text">AWAITING IMAGE</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: form.name ? 22 : 18, fontWeight: 900, color: form.name ? "#fff" : "rgba(255,255,255,0.2)", margin: "0 0 8px", lineHeight: 1.2, transition: "all 0.2s", minHeight: 32 }}>
                        {form.name || "Token Name"}
                      </h2>
                      <span className="ticker-badge">${form.symbol || "TICKER"}</span>
                    </div>
                    {form.description && (
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px", borderTop: "1px solid rgba(153,69,255,0.1)", paddingTop: 14 }}>
                        {form.description.slice(0, 120)}{form.description.length > 120 ? "..." : ""}
                      </p>
                    )}
                    {(form.website || form.twitter || form.telegram) && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {form.website && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>🌐 Web</div>}
                        {form.twitter && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>𝕏 Twitter</div>}
                        {form.telegram && <div style={{ background: "rgba(29,155,240,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "rgba(41,182,246,0.7)", fontWeight: 600 }}>✈ Telegram</div>}
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid rgba(153,69,255,0.12)", paddingTop: 16 }}>
                      <BondingCurveBar pct={0} />
                      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>Market cap</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'Orbitron', monospace", fontWeight: 700 }}>$0</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: -30, left: "10%", right: "10%", height: 60, background: "rgba(153,69,255,0.25)", filter: "blur(30px)", borderRadius: "50%", zIndex: 0 }} />
              </div>

              {/* Hints */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { done: !!form.name, text: "Token name" },
                  { done: !!form.symbol, text: "Ticker symbol" },
                  { done: !!imageFile, text: "Logo uploaded" },
                  { done: connected, text: "Wallet connected" },
                ].map(({ done, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: done ? "rgba(20,241,149,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${done ? "rgba(20,241,149,0.5)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: done ? "#14F195" : "rgba(255,255,255,0.2)", transition: "all 0.3s" }}>
                      {done ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 13, color: done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)", transition: "color 0.3s" }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}