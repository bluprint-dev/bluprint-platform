"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const MOCK_TOKENS = [
  { id: 1,  name: "SolCat",     symbol: "SOLCAT",  cap: "$68.5K", fill: 92, desc: "The internet's most degenerate feline, now living rent-free on Solana.", time: "2m",  replies: 312, hot: true  },
  { id: 2,  name: "PumpWhale",  symbol: "PMPWHL",  cap: "$41.2K", fill: 74, desc: "Coordinated mass accumulation via bonding curve mechanics.", time: "7m",  replies: 88,  hot: true  },
  { id: 3,  name: "DegenMage",  symbol: "DGMAGE",  cap: "$29.8K", fill: 55, desc: "On-chain wizard token. Spells are smart contracts.", time: "14m", replies: 54,  hot: false },
  { id: 4,  name: "RoboSol",    symbol: "RSOL",    cap: "$14.2K", fill: 33, desc: "AI-piloted accumulation engine turned community governance.", time: "21m", replies: 27,  hot: false },
  { id: 5,  name: "NeonFrog",   symbol: "NFRG",    cap: "$9.1K",  fill: 21, desc: "Pepe's neon-drenched Solana cousin. Faster. Cheaper.", time: "33m", replies: 19,  hot: false },
  { id: 6,  name: "SharkDAO",   symbol: "SHARK",   cap: "$7.4K",  fill: 17, desc: "Deep water liquidity predator. Hunts inefficiencies on-chain.", time: "41m", replies: 14,  hot: false },
  { id: 7,  name: "VoidOracle", symbol: "VORACLE", cap: "$4.4K",  fill: 9,  desc: "Sees the market before the market sees itself.", time: "51m", replies: 8,   hot: false },
  { id: 8,  name: "CyberYak",   symbol: "CYAK",    cap: "$2.1K",  fill: 5,  desc: "High-altitude degenerate stamina token. Never stop pumping.", time: "1h",  replies: 3,   hot: false },
];

const SPECS = [
  {
    tag: "01 / Virtual Pools",
    title: "Algorithmic Bonding Curves",
    body: "Constant-product (x·y=k) virtual reserve calculations establish programmatic floor pricing and protect initial purchasers from coordinated manipulation.",
    accent: "#9945FF",
  },
  {
    tag: "02 / Token Integrity",
    title: "Immutable SPL Standards",
    body: "Direct deployment via Metaplex token program with immutable authority revocation. Fully verified, fully permissionless, on-chain in under 10 seconds.",
    accent: "#14F195",
  },
  {
    tag: "03 / Autonomous Migrations",
    title: "Automated LP Burn Router",
    body: "At 100% curve capacity, all collected SOL migrates atomically to Raydium. LP tokens are permanently burned on-chain. No human intervention required.",
    accent: "#9945FF",
  },
];

const FILTERS = ["Latest Launches", "Market Cap", "24h Volume", "Curve Progress"];

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = MOCK_TOKENS.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0817] via-[#140C22] to-[#0A0410] text-white overflow-x-hidden"
      style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}>

      {/* ── GRID TEXTURE ── */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(153,69,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.025) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }} />

      {/* ══════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-7"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 w-fit px-4 py-1.5 rounded-full border"
              style={{ background: "rgba(20,241,149,0.06)", borderColor: "rgba(20,241,149,0.2)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full animate-ping"
                  style={{ background: "rgba(20,241,149,0.6)" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#14F195" }} />
              </span>
              <span className="text-[10px] font-bold tracking-[0.14em]" style={{ color: "#14F195" }}>
                WELCOME TO THE NEWEST SOLANA ECOSYSTEM
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Launch Fast.<br />
                <span style={{
                  background: "linear-gradient(90deg, #9945FF, #14F195)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>Trade Globally.</span>
              </h1>
              <p className="mt-5 text-sm leading-relaxed max-w-md"
                style={{ color: "rgba(255,255,255,0.42)", fontSize: 14 }}>
                The premium algorithmic bonding curve infrastructure on Solana. Built for pure transaction speed and automated Raydium pool migration.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap">
              <Link href="/create"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[#07070f] text-sm font-black tracking-wider transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #14F195, #0fa96a)",
                  boxShadow: "0 0 32px rgba(20,241,149,0.4), 0 4px 16px rgba(20,241,149,0.2)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 50px rgba(20,241,149,0.6), 0 4px 24px rgba(20,241,149,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(20,241,149,0.4), 0 4px 16px rgba(20,241,149,0.2)"; }}
              >
                ⬡ LAUNCH TOKEN
              </Link>
              <Link href="/dex"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all duration-200 backdrop-blur-sm"
                style={{
                  background: "rgba(153,69,255,0.08)",
                  border: "1px solid rgba(153,69,255,0.35)",
                  color: "rgba(153,69,255,0.9)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,69,255,0.65)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,69,255,0.35)"; }}
              >
                VIEW TERMINAL →
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-2">
              {[["1,240+", "TOKENS LAUNCHED"], ["$4.2M+", "TOTAL VOLUME"], ["< 10s", "DEPLOY TIME"]].map(([v, l]) => (
                <div key={l}>
                  <p className="text-xl font-black text-white">{v}</p>
                  <p className="text-[9px] tracking-[0.12em] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{l}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — floating logo */}
          <div className="relative flex items-center justify-center">
            {/* ambient orbs */}
            <div className="absolute rounded-full pointer-events-none"
              style={{ width: 420, height: 420, background: "radial-gradient(circle, rgba(153,69,255,0.22) 0%, transparent 70%)", filter: "blur(50px)" }} />
            <div className="absolute rounded-full pointer-events-none"
              style={{ width: 280, height: 280, background: "radial-gradient(circle, rgba(20,241,149,0.15) 0%, transparent 70%)", filter: "blur(40px)", transform: "translate(60px, 40px)" }} />

            {/* floating orca */}
            <motion.div
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              {/* glow ring */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(20,241,149,0.2) 0%, transparent 65%)",
                  filter: "blur(20px)",
                  transform: "scale(1.3)",
                }} />
              <img
                src="/favicon.ico"
                alt="BluPrint Cyber Orca"
                style={{
                  width: 360,
                  height: 360,
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 50px rgba(153,69,255,0.5)) drop-shadow(0 0 80px rgba(20,241,149,0.3))",
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #0A0410)" }} />
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — LIVE TRADING DESK
      ══════════════════════════════════════════ */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">

          {/* heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.2)" }}>
              <span className="text-[10px] font-bold tracking-[0.14em]" style={{ color: "rgba(153,69,255,0.7)" }}>◈ BLUEPRINT LIVE TRADING DESK</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
              The <span style={{ color: "#14F195" }}>Active</span> Launch Grid
            </h2>
          </motion.div>

          {/* KING OF THE HILL */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 rounded-2xl p-[1px]"
            style={{
              background: "linear-gradient(90deg, #9945FF, #14F195, #9945FF, #14F195)",
              backgroundSize: "300% 100%",
              animation: "borderFlow 3s linear infinite",
            }}
          >
            <div className="rounded-2xl p-6"
              style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.08), rgba(10,4,16,0.98))" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">👑</span>
                <span className="text-[10px] font-bold tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.25)" }}>KING OF THE HILL</span>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                {/* avatar */}
                <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: "linear-gradient(135deg, #9945FF, #14F195)", boxShadow: "0 0 28px rgba(20,241,149,0.4)" }}>
                  S
                </div>
                {/* info */}
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-black text-white">SolCat</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ color: "#14F195", background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)" }}>$SOLCAT</span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    MKT CAP: <span className="font-bold" style={{ color: "#14F195" }}>$68,500</span>
                    <span className="ml-5">VOLUME: <span className="font-bold" style={{ color: "#9945FF" }}>$12,400</span></span>
                  </p>
                </div>
                {/* progress */}
                <div className="flex-1 min-w-[220px]">
                  <p className="text-xs font-bold mb-2" style={{ color: "#14F195", animation: "textPulse 1.5s ease-in-out infinite" }}>
                    92% FILLED → MIGRATING TO RAYDIUM LP
                  </p>
                  <div className="h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full" style={{
                      width: "92%",
                      background: "linear-gradient(90deg, #9945FF, #14F195)",
                      boxShadow: "0 0 14px rgba(20,241,149,0.7)",
                      animation: "glowPulse 2s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* FILTER BAR */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex gap-3 mb-8 flex-wrap items-center"
          >
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                style={{ color: "rgba(153,69,255,0.5)" }}>›_</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search token, mint address..."
                className="w-full h-11 pl-9 pr-4 rounded-xl text-white text-xs outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(153,69,255,0.2)",
                  fontFamily: "inherit",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(20,241,149,0.55)"; e.target.style.boxShadow = "0 0 20px rgba(20,241,149,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(153,69,255,0.2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            {FILTERS.map((f, i) => (
              <button
                key={f}
                onClick={() => setActiveFilter(i)}
                className="px-4 py-2.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap"
                style={{
                  background: activeFilter === i ? "rgba(153,69,255,0.15)" : "rgba(153,69,255,0.04)",
                  border: `1px solid ${activeFilter === i ? "rgba(153,69,255,0.45)" : "rgba(153,69,255,0.12)"}`,
                  color: activeFilter === i ? "rgba(153,69,255,0.9)" : "rgba(255,255,255,0.3)",
                }}
              >{f}</button>
            ))}
          </motion.div>

          {/* TOKEN GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((token, i) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, boxShadow: "0 16px 44px rgba(153,69,255,0.22)" }}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, rgba(153,69,255,0.07), rgba(10,4,16,0.95))",
                  border: "1px solid rgba(153,69,255,0.14)",
                }}
              >
                <div className="p-4">
                  {/* header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-base font-black text-white"
                      style={{ background: "linear-gradient(135deg, #9945FF, #14F195)", boxShadow: "0 0 10px rgba(153,69,255,0.35)" }}>
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{token.name}</span>
                        {token.hot && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded"
                            style={{ color: "#14F195", background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)" }}>HOT</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold" style={{ color: "#14F195" }}>${token.symbol}</span>
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{token.time} ago</span>
                      </div>
                    </div>
                  </div>

                  {/* desc */}
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.35)", minHeight: 34 }}>
                    {token.desc}
                  </p>

                  {/* stats */}
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[9px] tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>MKT CAP</p>
                      <p className="text-sm font-bold" style={{ color: "#14F195" }}>{token.cap}</p>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>REPLIES</p>
                      <p className="text-sm font-bold" style={{ color: "rgba(153,69,255,0.85)" }}>{token.replies}</p>
                    </div>
                  </div>
                </div>

                {/* curve progress bar */}
                <div className="h-[3px]" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${token.fill}%`,
                      background: token.fill > 80
                        ? "linear-gradient(90deg, #9945FF, #14F195)"
                        : "linear-gradient(90deg, rgba(153,69,255,0.6), rgba(20,241,149,0.5))",
                      boxShadow: token.fill > 80 ? "0 0 8px rgba(20,241,149,0.7)" : "none",
                    }}
                  />
                </div>
                <div className="px-4 py-2 flex justify-between items-center">
                  <span className="text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>CURVE FILL</span>
                  <span className="text-[10px] font-bold" style={{ color: token.fill > 80 ? "#14F195" : "rgba(153,69,255,0.65)" }}>
                    {token.fill}%{token.fill > 80 ? " → RAYDIUM" : ""}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/dex"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-bold tracking-widest transition-all duration-200"
              style={{ background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.22)", color: "rgba(153,69,255,0.8)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,69,255,0.45)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(153,69,255,0.22)"; }}
            >VIEW ALL TOKENS →</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — ARCHITECTURE SPECS
      ══════════════════════════════════════════ */}
      <section className="relative z-10 py-20">
        <div className="h-px max-w-7xl mx-auto mb-16"
          style={{ background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.3), rgba(20,241,149,0.3), transparent)" }} />

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.15)" }}>
              <span className="text-[10px] font-bold tracking-[0.14em]" style={{ color: "rgba(20,241,149,0.6)" }}>◈ PROTOCOL ARCHITECTURE</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight">
              Why <span style={{ color: "#9945FF" }}>BluPrint</span> Wins
            </h2>
            <p className="mt-3 text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              Engineered to outperform at every protocol layer.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SPECS.map((spec, i) => (
              <motion.div
                key={spec.tag}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="rounded-2xl p-7 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(153,69,255,0.06), rgba(10,4,16,0.95))",
                  border: `1px solid ${spec.accent}20`,
                }}
              >
                {/* top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${spec.accent}60, transparent)` }} />

                <span className="block text-[9px] font-bold tracking-[0.16em] mb-5"
                  style={{ color: `${spec.accent}70` }}>{spec.tag}</span>

                <h3 className="text-lg font-black text-white mb-3 leading-tight">{spec.title}</h3>

                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)", lineHeight: 1.8 }}>
                  {spec.body}
                </p>

                <div className="mt-6 pt-5 flex gap-5"
                  style={{ borderTop: `1px solid ${spec.accent}12` }}>
                  {[["< 10s", "DEPLOY"], ["100%", "ON-CHAIN"], ["0", "ADMIN KEYS"]].map(([v, l]) => (
                    <div key={l}>
                      <p className="text-sm font-bold" style={{ color: spec.accent }}>{v}</p>
                      <p className="text-[9px] tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="relative z-10 pt-16 pb-10">
        <div className="h-px max-w-7xl mx-auto mb-12"
          style={{ background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.2), transparent)" }} />

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-6 mb-10">
            {/* brand */}
            <div className="flex items-center gap-3">
              <img src="/favicon.ico" alt="BluPrint" style={{ width: 36, height: 36, objectFit: "contain" }} />
              <div>
                <p className="font-black text-white text-base">BluPrint</p>
                <p className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Solana's fastest bonding-curve launchpad</p>
              </div>
            </div>

            {/* links */}
            <div className="flex gap-7 flex-wrap">
              {[["X / Twitter", "#"], ["Telegram", "#"], ["Docs", "#"], ["Solscan", "#"]].map(([label, href]) => (
                <a key={label as string} href={href as string}
                  className="text-xs font-semibold tracking-wider transition-colors duration-150"
                  style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}
                  onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = "#14F195"; }}
                  onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)"; }}
                >{label}</a>
              ))}
            </div>
          </div>

          <div className="pt-5 text-center" style={{ borderTop: "1px solid rgba(153,69,255,0.08)" }}>
            <p className="text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.12)" }}>
              Securely powered by Solana Mainnet Live Core © 2026 BluPrint Protocol.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes borderFlow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes glowPulse  { 0%,100%{box-shadow:0 0 14px rgba(20,241,149,0.7)} 50%{box-shadow:0 0 28px rgba(20,241,149,1)} }
        @keyframes textPulse  { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>
    </div>
  );
}