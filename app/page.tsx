"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { DexToken } from "@/types/dex";

const SPECS = [
  {
    tag: "01 / Virtual Pools",
    title: "Algorithmic Bonding Curves",
    body: "Constant-product (x·y=k) virtual reserve calculations establish programmatic floor pricing and protect initial purchasers from coordinated manipulation.",
    accent: "#9945FF",
    metrics: [["< 10s", "DEPLOY"], ["x·y=k", "FORMULA"], ["0", "ADMIN KEYS"]],
  },
  {
    tag: "02 / Token Integrity",
    title: "Immutable SPL Standards",
    body: "Direct deployment via Metaplex token program with immutable authority revocation. Fully verified, fully permissionless, on-chain in seconds.",
    accent: "#14F195",
    metrics: [["100%", "ON-CHAIN"], ["SPL", "STANDARD"], ["∞", "SUPPLY CTL"]],
  },
  {
    tag: "03 / Autonomous Migrations",
    title: "Automated LP Burn Router",
    body: "At 100% curve capacity, all collected SOL migrates atomically to Raydium. LP tokens are permanently burned on-chain. Zero human intervention.",
    accent: "#9945FF",
    metrics: [["AUTO", "MIGRATE"], ["BURN", "LP LOCK"], ["100%", "PERMLESS"]],
  },
];

const FILTERS = ["Latest", "Market Cap", "24h Volume", "Curve %"] as const;

export default function HomePage() {
  const [tokens, setTokens] = useState<DexToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/bonding-curve/tokens")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTokens(data.tokens ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tokens.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.mint.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (activeFilter === 0) return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    return 0;
  });

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #0a0414 0%, #110820 35%, #0a0414 100%)",
      }}
    >
      {/* FONT IMPORTS + GLOBAL STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; }

        .bp-font {
          font-family: 'Syne', 'Space Grotesk', system-ui, sans-serif !important;
        }
        .bp-mono {
          font-family: 'Space Mono', 'Courier New', monospace !important;
        }

        @keyframes borderFlow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes glowPulse  { 0%,100%{box-shadow:0 0 16px rgba(20,241,149,0.65)} 50%{box-shadow:0 0 32px rgba(20,241,149,1)} }
        @keyframes textPulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes float      { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
        @keyframes ping2      { 0%{transform:scale(1);opacity:0.8} 75%{transform:scale(2.2);opacity:0} 100%{transform:scale(1);opacity:0} }
        @keyframes spin       { to{transform:rotate(360deg)} }

        .token-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .token-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(153,69,255,0.22) !important; }
        .filter-btn:hover { border-color: rgba(153,69,255,0.5) !important; color: rgba(153,69,255,0.9) !important; }

        .bp-h1 {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: clamp(48px, 6vw, 80px) !important;
          font-weight: 800 !important;
          line-height: 1.05 !important;
          letter-spacing: -0.03em !important;
          margin: 0 !important;
          color: #ffffff !important;
        }
        .bp-h2 {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: clamp(30px, 4vw, 52px) !important;
          font-weight: 800 !important;
          line-height: 1.1 !important;
          letter-spacing: -0.025em !important;
          margin: 0 !important;
          color: #ffffff !important;
        }
        .bp-h3 {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: 20px !important;
          font-weight: 800 !important;
          line-height: 1.3 !important;
          letter-spacing: -0.015em !important;
          margin: 0 0 12px !important;
          color: #ffffff !important;
        }
        .bp-body {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: 16px !important;
          font-weight: 400 !important;
          line-height: 1.75 !important;
          color: rgba(255,255,255,0.45) !important;
        }
        .bp-label {
          font-family: 'Space Mono', monospace !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.16em !important;
        }
        .bp-stat-num {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: 28px !important;
          font-weight: 800 !important;
          letter-spacing: -0.02em !important;
          color: #ffffff !important;
          margin: 0 !important;
          line-height: 1 !important;
        }
        .bp-stat-label {
          font-family: 'Space Mono', monospace !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          letter-spacing: 0.14em !important;
          color: rgba(255,255,255,0.22) !important;
          margin: 5px 0 0 !important;
        }
        .bp-token-name {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          line-height: 1.2 !important;
        }
        .bp-token-symbol {
          font-family: 'Space Mono', monospace !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          color: #14F195 !important;
        }
        .bp-card-label {
          font-family: 'Space Mono', monospace !important;
          font-size: 9px !important;
          letter-spacing: 0.12em !important;
          color: rgba(255,255,255,0.18) !important;
        }
        .bp-cta-primary {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: 14px !important;
          font-weight: 800 !important;
          letter-spacing: 0.08em !important;
        }
        .bp-cta-secondary {
          font-family: 'Syne', system-ui, sans-serif !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          letter-spacing: 0.06em !important;
        }
      `}</style>

      {/* GRID TEXTURE */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(153,69,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.022) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }} />

      {/* AMBIENT BLOBS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(153,69,255,0.09) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "30%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,241,149,0.06) 0%, transparent 65%)", filter: "blur(50px)" }} />
      </div>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-24 w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-8"
          >
            {/* live badge */}
            <div className="inline-flex items-center gap-2.5 w-fit px-4 py-2 rounded-full"
              style={{ background: "rgba(20,241,149,0.06)", border: "1px solid rgba(20,241,149,0.18)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full" style={{ background: "rgba(20,241,149,0.55)", animation: "ping2 1.6s ease-out infinite" }} />
                <span className="relative flex h-2 w-2 rounded-full" style={{ background: "#14F195", boxShadow: "0 0 6px #14F195" }} />
              </span>
              <span className="bp-label" style={{ color: "#14F195" }}>
                SOLANA MAINNET · LIVE NOW
              </span>
            </div>

            {/* headline */}
            <div>
              <h1 className="bp-h1">
                Launch Fast.<br />
                <span style={{
                  background: "linear-gradient(95deg, #9945FF 0%, #c084fc 45%, #14F195 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "inline-block",
                }}>Trade Globally.</span>
              </h1>
              <p className="bp-body" style={{ marginTop: 24, maxWidth: 480 }}>
                The premium algorithmic bonding curve infrastructure on Solana. Built for pure transaction speed and automated Raydium pool migration.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap">
              <Link href="/create" className="bp-cta-primary" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 32px", borderRadius: 14,
                background: "linear-gradient(135deg, #14F195, #0fa96a)",
                color: "#07070f", textDecoration: "none",
                boxShadow: "0 0 36px rgba(20,241,149,0.4), 0 4px 20px rgba(20,241,149,0.2)",
              }}>
                ⬡ LAUNCH TOKEN · 0.15 SOL
              </Link>
              <Link href="/dex" className="bp-cta-secondary" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 28px", borderRadius: 14,
                background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.32)",
                color: "rgba(153,69,255,0.9)", textDecoration: "none",
                backdropFilter: "blur(12px)",
              }}>
                VIEW TERMINAL →
              </Link>
            </div>

            {/* stats */}
            <div className="flex gap-10 pt-2">
              {[
                [tokens.length > 0 ? `${tokens.length}+` : "—", "TOKENS LIVE"],
                ["< 10s", "DEPLOY TIME"],
                ["100%", "ON-CHAIN"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="bp-stat-num">{v}</p>
                  <p className="bp-stat-label">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — floating logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center relative"
          >
            <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(153,69,255,0.28) 0%, transparent 65%)", filter: "blur(56px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,241,149,0.18) 0%, transparent 65%)", filter: "blur(40px)", pointerEvents: "none", transform: "translate(40px, 30px)" }} />
            <div style={{ animation: "float 5s ease-in-out infinite", position: "relative", zIndex: 10 }}>
              <img
                src="/favicon.ico"
                alt="BluPrint"
                style={{
                  width: 460, height: 460, objectFit: "contain",
                  filter: "drop-shadow(0 0 60px rgba(153,69,255,0.55)) drop-shadow(0 0 100px rgba(20,241,149,0.3))",
                }}
              />
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #0a0414)" }} />
      </section>

      {/* ══════════════════════════════
          LIVE TOKEN GRID
      ══════════════════════════════ */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.18)" }}>
              <span className="bp-label" style={{ color: "rgba(153,69,255,0.65)" }}>◈ BLUEPRINT LIVE TRADING DESK</span>
            </div>
            <h2 className="bp-h2">
              The <span style={{ color: "#14F195" }}>Active</span> Launch Grid
            </h2>
          </motion.div>

          {/* KING OF THE HILL */}
          {tokens.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 rounded-2xl p-[1.5px]"
              style={{ background: "linear-gradient(90deg, #9945FF, #14F195, #9945FF)", backgroundSize: "300% 100%", animation: "borderFlow 3s linear infinite" }}>
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.08), rgba(10,4,16,0.98))" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span>👑</span>
                  <span className="bp-label" style={{ color: "rgba(255,255,255,0.22)" }}>KING OF THE HILL</span>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  {tokens[0].imageUrl ? (
                    <img src={tokens[0].imageUrl} alt={tokens[0].name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 0 28px rgba(20,241,149,0.4)" }} />
                  ) : (
                    <div className="bp-font" style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #9945FF, #14F195)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", boxShadow: "0 0 28px rgba(20,241,149,0.4)" }}>
                      {tokens[0].symbol?.[0] ?? "?"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bp-font" style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{tokens[0].name}</span>
                      <span className="bp-mono" style={{ fontSize: 11, fontWeight: 700, color: "#14F195", background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)", padding: "2px 8px", borderRadius: 6 }}>${tokens[0].symbol}</span>
                    </div>
                    <p className="bp-mono" style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {tokens[0].mint.slice(0, 8)}...{tokens[0].mint.slice(-6)}
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p className="bp-mono" style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#14F195", animation: "textPulse 1.5s ease-in-out infinite" }}>
                      LIVE ON BONDING CURVE → TRADE NOW
                    </p>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ height: "100%", width: "68%", borderRadius: 4, background: "linear-gradient(90deg, #9945FF, #14F195)", animation: "glowPulse 2s ease-in-out infinite" }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* FILTER BAR */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex gap-3 mb-8 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="bp-mono" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(153,69,255,0.45)", fontSize: 13, pointerEvents: "none" }}>›_</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search token, symbol, mint address..."
                style={{
                  width: "100%", height: 44, paddingLeft: 36, paddingRight: 14,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(153,69,255,0.18)",
                  borderRadius: 12, color: "#fff", fontSize: 12, outline: "none",
                  boxSizing: "border-box", fontFamily: "'Space Mono', monospace",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(20,241,149,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(20,241,149,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(153,69,255,0.18)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            {FILTERS.map((f, i) => (
              <button key={f} onClick={() => setActiveFilter(i)} className="filter-btn bp-mono"
                style={{
                  padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                  background: activeFilter === i ? "rgba(153,69,255,0.14)" : "rgba(153,69,255,0.04)",
                  border: `1px solid ${activeFilter === i ? "rgba(153,69,255,0.45)" : "rgba(153,69,255,0.12)"}`,
                  color: activeFilter === i ? "rgba(153,69,255,0.95)" : "rgba(255,255,255,0.28)",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap",
                  transition: "all 0.18s",
                }}>{f}</button>
            ))}
          </motion.div>

          {/* TOKEN GRID */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(153,69,255,0.3)", borderTopColor: "#9945FF", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                  <p className="bp-mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Loading tokens...</p>
                </div>
              </motion.div>
            ) : sorted.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center">
                <div style={{ animation: "float 4s ease-in-out infinite", marginBottom: 28 }}>
                  <img src="/favicon.ico" alt="BluPrint" style={{ width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 30px rgba(153,69,255,0.5))", opacity: 0.85 }} />
                </div>
                <h3 className="bp-font" style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                  No tokens yet.
                </h3>
                <p className="bp-body" style={{ marginBottom: 28, maxWidth: 360 }}>
                  Be the first to launch a token on BluPrint. Your coin will appear here — live on the bonding curve — seconds after creation.
                </p>
                <Link href="/create" className="bp-cta-primary" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 32px", borderRadius: 14,
                  background: "linear-gradient(135deg, #14F195, #0fa96a)",
                  color: "#07070f", textDecoration: "none",
                  boxShadow: "0 0 36px rgba(20,241,149,0.4)",
                }}>⬡ CREATE THE FIRST TOKEN</Link>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sorted.map((token, i) => (
                  <motion.div key={token.mint} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="token-card rounded-2xl overflow-hidden cursor-pointer"
                    style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.07), rgba(10,4,16,0.95))", border: "1px solid rgba(153,69,255,0.13)" }}>
                    <div style={{ padding: "16px 16px 12px" }}>
                      <div className="flex items-center gap-3 mb-3">
                        {token.imageUrl ? (
                          <img src={token.imageUrl} alt={token.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 0 12px rgba(153,69,255,0.35)" }} />
                        ) : (
                          <div className="bp-font" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #9945FF, #14F195)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "#fff" }}>
                            {token.symbol?.[0] ?? "?"}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="bp-token-name">{token.name}</span>
                            {i === 0 && <span className="bp-mono" style={{ fontSize: 8, fontWeight: 700, color: "#14F195", background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)", padding: "1px 5px", borderRadius: 4 }}>HOT</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="bp-token-symbol">${token.symbol}</span>
                            {token.createdAt && (
                              <span className="bp-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                                {getTimeAgo(token.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="bp-mono" style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.25)", wordBreak: "break-all" }}>
                        {token.mint.slice(0, 12)}...{token.mint.slice(-8)}
                      </p>
                      <div className="flex gap-4">
                        <div>
                          <p className="bp-card-label" style={{ margin: 0 }}>CREATOR</p>
                          <p className="bp-mono" style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 700, color: "rgba(153,69,255,0.8)" }}>
                            {token.creator ? `${token.creator.slice(0, 6)}...` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="bp-card-label" style={{ margin: 0 }}>STATUS</p>
                          <p className="bp-mono" style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 700, color: "#14F195" }}>LIVE</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ height: "100%", width: "42%", background: "linear-gradient(90deg, rgba(153,69,255,0.7), rgba(20,241,149,0.6))" }} />
                    </div>
                    <div style={{ padding: "5px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="bp-card-label">CURVE FILL</span>
                      <Link href={`/dex?mint=${token.mint}`} className="bp-mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(153,69,255,0.7)", textDecoration: "none" }}>
                        TRADE →
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {sorted.length > 0 && (
            <div className="text-center mt-10">
              <Link href="/dex" className="bp-mono" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: 12,
                background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.2)",
                color: "rgba(153,69,255,0.8)", textDecoration: "none",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              }}>VIEW ALL TOKENS →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════
          PROTOCOL SPECS
      ══════════════════════════════ */}
      <section className="relative z-10 py-20">
        <div style={{ height: 1, maxWidth: 1280, margin: "0 auto 64px", background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.28), rgba(20,241,149,0.28), transparent)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.14)" }}>
              <span className="bp-label" style={{ color: "rgba(20,241,149,0.55)" }}>◈ PROTOCOL ARCHITECTURE</span>
            </div>
            <h2 className="bp-h2">
              Why <span style={{ color: "#9945FF" }}>BluPrint</span> Wins
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SPECS.map((spec, i) => (
              <motion.div key={spec.tag} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.06), rgba(10,4,16,0.96))", border: `1px solid ${spec.accent}1a`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${spec.accent}55, transparent)` }} />
                <span className="bp-label" style={{ display: "block", marginBottom: 18, color: `${spec.accent}70` }}>{spec.tag}</span>
                <h3 className="bp-h3">{spec.title}</h3>
                <p className="bp-body" style={{ fontSize: 13, marginBottom: 22 }}>{spec.body}</p>
                <div style={{ paddingTop: 18, borderTop: `1px solid ${spec.accent}10`, display: "flex", gap: 22 }}>
                  {spec.metrics.map(([v, l]) => (
                    <div key={l}>
                      <p className="bp-mono" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: spec.accent }}>{v}</p>
                      <p className="bp-card-label" style={{ margin: "3px 0 0" }}>{l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer className="relative z-10 pt-14 pb-10">
        <div style={{ height: 1, maxWidth: 1280, margin: "0 auto 48px", background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.18), transparent)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img src="/favicon.ico" alt="BluPrint" style={{ width: 38, height: 38, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(153,69,255,0.4))" }} />
              <div>
                <p className="bp-font" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>BluPrint</p>
                <p className="bp-mono" style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>Solana's fastest bonding-curve launchpad</p>
              </div>
            </div>
            <div className="flex gap-7 flex-wrap">
              {[["X / Twitter", "#"], ["Telegram", "#"], ["Docs", "#"], ["Solscan", "#"]].map(([label, href]) => (
                <a key={label as string} href={href as string} className="bp-mono" style={{ color: "rgba(255,255,255,0.28)", textDecoration: "none", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", transition: "color 0.15s" }}
                  onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = "#14F195"; }}
                  onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.28)"; }}
                >{label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(153,69,255,0.07)", paddingTop: 18, textAlign: "center" }}>
            <p className="bp-mono" style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
              Securely powered by Solana Mainnet Live Core © 2026 BluPrint Protocol.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}