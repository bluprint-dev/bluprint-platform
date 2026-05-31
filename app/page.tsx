"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";

// ─── MOCK TOKENS ─────────────────────────────────────────────────────────────
const MOCK_TOKENS = [
  { id: 1, name: "WhaleDAO", symbol: "WDAO", cap: "482K", fill: 94, desc: "The first community-owned whale intelligence network on Solana. Apes together strong.", time: "2m", replies: 312 },
  { id: 2, name: "CyberPepe", symbol: "CPEPE", cap: "291K", fill: 67, desc: "Pepe evolved. Neon circuits replace his lily pad. The future is chrome and green.", time: "7m", replies: 88 },
  { id: 3, name: "SolDoge", symbol: "SDOGE", cap: "178K", fill: 45, desc: "Much fast. Very cheap. Wow. Solana's fastest dog is here to eat your gas fees.", time: "14m", replies: 54 },
  { id: 4, name: "RoboSol", symbol: "RSOL", cap: "99K", fill: 29, desc: "An AI-piloted trading bot turned into a community token. The machine is now alive.", time: "21m", replies: 27 },
  { id: 5, name: "MemePump", symbol: "MPMP", cap: "61K", fill: 18, desc: "Pure concentrated meme energy distilled into a single fungible token on-chain.", time: "33m", replies: 19 },
  { id: 6, name: "DegenOrc", symbol: "DORC", cap: "44K", fill: 11, desc: "Orca finance meets degen culture. Swim with the whales or get liquidated trying.", time: "51m", replies: 8 },
];

const FILTERS = ["Newest", "Market Cap", "24h Volume", "Curve %"];

const SPECS = [
  {
    icon: "⬡",
    title: "Algorithmic Virtual Reserves",
    body: "Mathematical constant-product bonding curves protect initial purchasers and establish immediate, programmatic floor pricing.",
    accent: "#9945FF",
    tag: "01 / CORE",
  },
  {
    icon: "◈",
    title: "Instant Genesis Minting",
    body: "Direct deployment via Metaplex token program in under 10 seconds. Fully verified, fully permissionless.",
    accent: "#14F195",
    tag: "02 / MINT",
  },
  {
    icon: "⬡",
    title: "Automated Liquidity Locks",
    body: "The moment a token curve hits 100% capacity, all collected SOL is instantly migrated, burned, and locked permanently as a Raydium LP.",
    accent: "#9945FF",
    tag: "03 / LOCK",
  },
];

// ─── CYBER ORCA SVG (layered for split animation) ────────────────────────────
function CyberOrca({
  shellX = 0,
  shellY = 0,
  shellOpacity = 1,
  coreScale = 1,
  coreOpacity = 1,
}: {
  shellX?: number;
  shellY?: number;
  shellOpacity?: number;
  coreScale?: number;
  coreOpacity?: number;
}) {
  return (
    <div style={{ position: "relative", width: 420, height: 380 }}>
      {/* glow base */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 55%, rgba(20,241,149,0.18) 0%, rgba(153,69,255,0.12) 45%, transparent 70%)",
        filter: "blur(24px)",
        borderRadius: "50%",
      }} />

      {/* CORE — inner neon circuits (scales in on scroll) */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          scale: coreScale,
          opacity: coreOpacity,
        }}
      >
        <svg viewBox="0 0 420 380" width="420" height="380" xmlns="http://www.w3.org/2000/svg">
          {/* core glow orb */}
          <ellipse cx="185" cy="220" rx="72" ry="52"
            fill="rgba(20,241,149,0.18)"
            stroke="#14F195" strokeWidth="1.5" />
          <ellipse cx="185" cy="220" rx="44" ry="30"
            fill="rgba(20,241,149,0.35)"
            stroke="#14F195" strokeWidth="2" />
          <ellipse cx="185" cy="218" rx="22" ry="16"
            fill="rgba(20,241,149,0.7)" />
          {/* circuit lines */}
          <line x1="140" y1="200" x2="100" y2="180" stroke="#14F195" strokeWidth="1" opacity="0.6" />
          <line x1="100" y1="180" x2="80" y2="190" stroke="#14F195" strokeWidth="1" opacity="0.6" />
          <line x1="140" y1="240" x2="110" y2="260" stroke="#14F195" strokeWidth="1" opacity="0.6" />
          <line x1="230" y1="200" x2="280" y2="175" stroke="#14F195" strokeWidth="1" opacity="0.6" />
          <line x1="230" y1="240" x2="270" y2="255" stroke="#14F195" strokeWidth="1" opacity="0.6" />
          {/* circuit nodes */}
          {[[100,180],[80,190],[110,260],[280,175],[270,255]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#14F195" opacity="0.8" />
          ))}
          {/* spine line */}
          <line x1="120" y1="190" x2="310" y2="185" stroke="#9945FF" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
        </svg>
      </motion.div>

      {/* SHELL TOP — splits upward */}
      <motion.div style={{
        position: "absolute", inset: 0,
        y: -shellY * 0.6,
        x: -shellX * 0.2,
        opacity: shellOpacity,
      }}>
        <svg viewBox="0 0 420 380" width="420" height="380" xmlns="http://www.w3.org/2000/svg">
          {/* upper body / back */}
          <path d="M120 200 Q150 130 230 120 Q310 110 340 160 Q360 190 340 210 Q300 180 230 175 Q160 170 120 200Z"
            fill="rgba(80,30,140,0.85)" stroke="#9945FF" strokeWidth="1.5" />
          {/* dorsal fin */}
          <path d="M240 125 Q255 80 280 70 Q295 95 280 125Z"
            fill="rgba(100,40,180,0.8)" stroke="#9945FF" strokeWidth="1.5" />
          {/* armor panels */}
          <path d="M155 165 L180 155 L200 162 L195 175 L165 178Z"
            fill="none" stroke="#9945FF" strokeWidth="1" opacity="0.7" />
          <path d="M210 160 L240 153 L260 162 L252 172 L218 172Z"
            fill="none" stroke="#9945FF" strokeWidth="1" opacity="0.7" />
          {/* circuit etch */}
          <line x1="160" y1="155" x2="175" y2="145" stroke="#14F195" strokeWidth="0.8" opacity="0.5" />
          <line x1="220" y1="152" x2="235" y2="143" stroke="#14F195" strokeWidth="0.8" opacity="0.5" />
          {/* sparkles */}
          <circle cx="290" cy="140" r="2" fill="#fff" opacity="0.9" />
          <circle cx="195" cy="128" r="1.5" fill="#14F195" opacity="0.8" />
        </svg>
      </motion.div>

      {/* SHELL BOTTOM — splits downward */}
      <motion.div style={{
        position: "absolute", inset: 0,
        y: shellY * 0.5,
        x: shellX * 0.15,
        opacity: shellOpacity,
      }}>
        <svg viewBox="0 0 420 380" width="420" height="380" xmlns="http://www.w3.org/2000/svg">
          {/* belly */}
          <path d="M110 210 Q130 270 190 290 Q250 305 300 275 Q330 255 335 225 Q290 250 220 248 Q155 245 110 210Z"
            fill="rgba(20,241,149,0.25)" stroke="#14F195" strokeWidth="1.5" />
          {/* belly glow line */}
          <path d="M130 235 Q175 260 230 258 Q270 256 305 240"
            fill="none" stroke="#14F195" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
          {/* pectoral fin */}
          <path d="M145 235 Q120 265 115 285 Q135 278 155 260 Q165 248 155 237Z"
            fill="rgba(80,30,140,0.7)" stroke="#9945FF" strokeWidth="1.5" />
          {/* bottom armor */}
          <path d="M165 248 L185 255 L200 250 L195 262 L170 260Z"
            fill="none" stroke="#9945FF" strokeWidth="1" opacity="0.6" />
        </svg>
      </motion.div>

      {/* TAIL — splits right */}
      <motion.div style={{
        position: "absolute", inset: 0,
        x: shellX * 0.8,
        opacity: shellOpacity,
      }}>
        <svg viewBox="0 0 420 380" width="420" height="380" xmlns="http://www.w3.org/2000/svg">
          <path d="M310 200 Q340 170 370 155 Q385 175 375 195 Q365 210 340 215Z"
            fill="rgba(120,60,220,0.7)" stroke="#9945FF" strokeWidth="1.5" />
          <path d="M310 215 Q338 240 365 255 Q372 238 360 222 Q340 218 320 215Z"
            fill="rgba(20,241,149,0.6)" stroke="#14F195" strokeWidth="1.5" />
          <line x1="330" y1="178" x2="350" y2="168" stroke="#14F195" strokeWidth="1" opacity="0.6" />
          <circle cx="370" cy="160" r="2" fill="#14F195" opacity="0.9" />
        </svg>
      </motion.div>

      {/* OUTLINE / outline stroke always visible */}
      <svg viewBox="0 0 420 380" width="420" height="380"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="210" cy="205" rx="180" ry="130"
          fill="none" stroke="rgba(153,69,255,0.12)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ─── TOKEN CARD ───────────────────────────────────────────────────────────────
function TokenCard({ token, index }: { token: typeof MOCK_TOKENS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        background: "linear-gradient(135deg, rgba(153,69,255,0.07) 0%, rgba(20,241,149,0.03) 100%)",
        border: "1px solid rgba(153,69,255,0.18)",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "box-shadow 0.2s",
      }}
      onHoverStart={e => { (e.target as HTMLElement).style && ((e.target as HTMLElement).closest?.("[data-card]") as HTMLElement | null)?.style && null; }}
    >
      <div style={{ padding: "14px 14px 0" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, #9945FF, #14F195)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "#fff",
            boxShadow: "0 0 12px rgba(153,69,255,0.4)",
          }}>{token.symbol[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{token.name}</span>
              <span style={{
                color: "#14F195", fontFamily: "monospace", fontSize: 10, fontWeight: 700,
                background: "rgba(20,241,149,0.08)", padding: "1px 6px", borderRadius: 4,
              }}>${token.symbol}</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 10 }}>
              {token.time} ago
            </span>
          </div>
        </div>

        {/* desc */}
        <p style={{
          color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 1.6,
          marginBottom: 10, minHeight: 36,
        }}>{token.desc}</p>

        {/* stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em" }}>MKT CAP</span>
            <p style={{ color: "#14F195", fontFamily: "monospace", fontSize: 14, fontWeight: 700, margin: 0 }}>
              ${token.cap}
            </p>
          </div>
          <div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em" }}>REPLIES</span>
            <p style={{ color: "rgba(153,69,255,0.9)", fontFamily: "monospace", fontSize: 14, fontWeight: 700, margin: 0 }}>
              {token.replies}
            </p>
          </div>
        </div>
      </div>

      {/* bonding curve fill bar at bottom */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.04)" }}>
        <div style={{
          height: "100%",
          width: `${token.fill}%`,
          background: token.fill > 80
            ? "linear-gradient(90deg, #9945FF, #14F195)"
            : "linear-gradient(90deg, rgba(153,69,255,0.6), rgba(20,241,149,0.6))",
          boxShadow: token.fill > 80 ? "0 0 8px rgba(20,241,149,0.6)" : "none",
          transition: "width 1s ease",
          borderRadius: "0 0 16px 16px",
        }} />
      </div>
      <div style={{ padding: "4px 14px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9 }}>
          CURVE_FILL
        </span>
        <span style={{
          fontFamily: "monospace", fontSize: 10, fontWeight: 700,
          color: token.fill > 80 ? "#14F195" : "rgba(153,69,255,0.7)",
        }}>{token.fill}%{token.fill > 80 ? " → RAYDIUM" : ""}</span>
      </div>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Shell splits outward as user scrolls
  const shellX = useTransform(scrollYProgress, [0, 0.6], [0, 180]);
  const shellY = useTransform(scrollYProgress, [0, 0.6], [0, 120]);
  const shellOpacity = useTransform(scrollYProgress, [0.4, 0.7], [1, 0]);

  // Core expands
  const coreScale = useTransform(scrollYProgress, [0.1, 0.5], [0.6, 1.2]);
  const coreOpacity = useTransform(scrollYProgress, [0, 0.15, 0.6, 0.75], [0, 1, 1, 0]);

  // Spec badges stagger in
  const spec1Opacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);
  const spec2Opacity = useTransform(scrollYProgress, [0.25, 0.4], [0, 1]);
  const spec3Opacity = useTransform(scrollYProgress, [0.4, 0.55], [0, 1]);
  const spec1Y = useTransform(scrollYProgress, [0.1, 0.25], [30, 0]);
  const spec2Y = useTransform(scrollYProgress, [0.25, 0.4], [30, 0]);
  const spec3Y = useTransform(scrollYProgress, [0.4, 0.55], [30, 0]);

  // Left column fades in immediately
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0F0817 0%, #140C22 50%, #0A0410 100%)",
      overflowX: "hidden",
      position: "relative",
    }}>

      {/* ── GLOBAL AMBIENT BLOBS ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "5%", left: "10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(153,69,255,0.1) 0%, transparent 70%)",
          animation: "blob1 22s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,241,149,0.07) 0%, transparent 70%)",
          animation: "blob2 28s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(153,69,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position: "relative", zIndex: 1, minHeight: "300vh" }}>

        {/* sticky viewport */}
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center" }}>

          {/* scan line top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, #9945FF 30%, #14F195 70%, transparent)",
            opacity: 0.5, zIndex: 10,
          }} />

          <div style={{
            maxWidth: 1280, margin: "0 auto", padding: "0 24px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60,
            alignItems: "center", width: "100%",
          }}>

            {/* ── LEFT: Copy + Spec Badges ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Live badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content" }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 14px", borderRadius: 20,
                  background: "rgba(20,241,149,0.06)",
                  border: "1px solid rgba(20,241,149,0.2)",
                }}>
                  <div style={{ position: "relative", width: 8, height: 8 }}>
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "#14F195",
                      animation: "ping 1.5s ease-out infinite",
                    }} />
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "#14F195", boxShadow: "0 0 6px #14F195",
                    }} />
                  </div>
                  <span style={{
                    color: "#14F195", fontFamily: "monospace", fontSize: 11,
                    fontWeight: 700, letterSpacing: "0.1em",
                  }}>SOLANA MAINNET LIVE</span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <h1 style={{
                  margin: 0, color: "#fff",
                  fontSize: "clamp(36px, 5vw, 62px)",
                  fontWeight: 900, letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}>
                  Launch Fast.<br />
                  <span style={{
                    background: "linear-gradient(90deg, #9945FF, #14F195)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>Trade Globally.</span>
                </h1>
                <p style={{
                  marginTop: 16, color: "rgba(255,255,255,0.45)",
                  fontSize: 15, lineHeight: 1.7, maxWidth: 480,
                  fontFamily: "monospace",
                }}>
                  The ultimate bonding-curve meme coin incubator on Solana. Built for pure velocity. Engineered to eliminate rugpulls entirely.
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
              >
                <Link href="/create" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "13px 28px", borderRadius: 14,
                  background: "linear-gradient(135deg, #14F195, #0fa96a)",
                  color: "#07070f", textDecoration: "none",
                  fontSize: 14, fontWeight: 900, letterSpacing: "0.08em",
                  boxShadow: "0 0 30px rgba(20,241,149,0.35), 0 4px 20px rgba(20,241,149,0.2)",
                  transition: "box-shadow 0.2s, transform 0.15s",
                  fontFamily: "monospace",
                }}>
                  ⬡ LAUNCH TOKEN
                </Link>
                <Link href="/dex" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "13px 28px", borderRadius: 14,
                  background: "rgba(153,69,255,0.08)",
                  border: "1px solid rgba(153,69,255,0.3)",
                  color: "rgba(153,69,255,0.9)", textDecoration: "none",
                  fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
                  backdropFilter: "blur(12px)",
                  fontFamily: "monospace",
                  transition: "border-color 0.2s",
                }}>
                  EXPLORE MARKETBOARD →
                </Link>
              </motion.div>

              {/* Scroll-driven spec badges */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {[
                  { label: "01. VIRTUAL RESERVES ALGORITHM", opacity: spec1Opacity, y: spec1Y },
                  { label: "02. METAPLEX DIRECT MINT", opacity: spec2Opacity, y: spec2Y },
                  { label: "03. GUARANTEED LP MIGRATION", opacity: spec3Opacity, y: spec3Y },
                ].map(({ label, opacity, y }) => (
                  <motion.div key={label} style={{ opacity, y }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 10,
                      padding: "8px 14px", borderRadius: 10,
                      background: "rgba(153,69,255,0.06)",
                      border: "1px solid rgba(153,69,255,0.15)",
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#14F195", boxShadow: "0 0 6px #14F195",
                      }} />
                      <span style={{
                        color: "rgba(255,255,255,0.6)", fontFamily: "monospace",
                        fontSize: 11, letterSpacing: "0.08em",
                      }}>{label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Cyber Orca ── */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <CyberOrca
                shellX={shellX as unknown as number}
                shellY={shellY as unknown as number}
                shellOpacity={shellOpacity as unknown as number}
                coreScale={coreScale as unknown as number}
                coreOpacity={coreOpacity as unknown as number}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — LIVE TOKEN ARENA
      ════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", zIndex: 2, padding: "80px 0 60px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>

          {/* section label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 20,
              background: "rgba(153,69,255,0.08)",
              border: "1px solid rgba(153,69,255,0.2)",
              marginBottom: 16,
            }}>
              <span style={{ color: "rgba(153,69,255,0.7)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em" }}>
                ◈ LIVE TOKEN ARENA
              </span>
            </div>
            <h2 style={{
              margin: 0, color: "#fff",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900, letterSpacing: "-0.01em",
            }}>
              The <span style={{ color: "#14F195" }}>Active</span> Launch Grid
            </h2>
          </motion.div>

          {/* ── KING OF THE HILL ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              marginBottom: 32, borderRadius: 20, overflow: "hidden",
              background: "linear-gradient(135deg, rgba(153,69,255,0.1) 0%, rgba(20,241,149,0.05) 100%)",
              position: "relative",
            }}
          >
            {/* moving neon border */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 20,
              padding: 1, background: "linear-gradient(90deg, #9945FF, #14F195, #9945FF, #14F195)",
              backgroundSize: "300% 100%",
              animation: "borderFlow 4s linear infinite",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              pointerEvents: "none",
            }} />

            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 14 }}>👑</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em" }}>
                  KING OF THE HILL
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #9945FF, #14F195)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 30px rgba(20,241,149,0.4)",
                }}>W</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 24 }}>WhaleDAO</span>
                    <span style={{
                      color: "#14F195", fontFamily: "monospace", fontSize: 14, fontWeight: 700,
                      background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)",
                      padding: "2px 8px", borderRadius: 6,
                    }}>$WDAO</span>
                  </div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 12 }}>
                    MKT CAP: <span style={{ color: "#14F195", fontWeight: 700 }}>$482,000</span>
                    <span style={{ marginLeft: 20 }}>HOLDERS: <span style={{ color: "#9945FF", fontWeight: 700 }}>1,204</span></span>
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{
                      color: "#14F195", fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                      animation: "textPulse 1.5s ease-in-out infinite",
                    }}>94% FILLED → MIGRATING TO RAYDIUM POOL SOON</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: "94%", borderRadius: 5,
                      background: "linear-gradient(90deg, #9945FF, #14F195)",
                      boxShadow: "0 0 16px rgba(20,241,149,0.7)",
                      animation: "glowPulse 2s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── CONTROL BAR ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: 28, flexWrap: "wrap",
            }}
          >
            {/* search */}
            <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "rgba(153,69,255,0.5)", fontFamily: "monospace", fontSize: 14,
                pointerEvents: "none",
              }}>›_</span>
              <input
                type="text"
                placeholder="Search token, symbol, or mint address..."
                style={{
                  width: "100%", height: 46,
                  paddingLeft: 40, paddingRight: 16,
                  background: "#07070f",
                  border: "1px solid rgba(153,69,255,0.2)",
                  borderRadius: 12, color: "#fff",
                  fontSize: 13, fontFamily: "monospace",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(20,241,149,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(20,241,149,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(153,69,255,0.2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            {/* filter pills */}
            {FILTERS.map((f, i) => (
              <button key={f} style={{
                padding: "10px 16px", borderRadius: 20,
                background: i === 0 ? "rgba(153,69,255,0.15)" : "rgba(153,69,255,0.04)",
                border: `1px solid ${i === 0 ? "rgba(153,69,255,0.4)" : "rgba(153,69,255,0.12)"}`,
                color: i === 0 ? "rgba(153,69,255,0.9)" : "rgba(255,255,255,0.35)",
                fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.06em", cursor: "pointer",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>{f}</button>
            ))}
          </motion.div>

          {/* ── TOKEN GRID ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {MOCK_TOKENS.map((token, i) => (
              <TokenCard key={token.id} token={token} index={i} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/dex" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 14,
              background: "rgba(153,69,255,0.08)",
              border: "1px solid rgba(153,69,255,0.25)",
              color: "rgba(153,69,255,0.8)", textDecoration: "none",
              fontFamily: "monospace", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.08em", transition: "all 0.2s",
            }}>VIEW ALL TOKENS →</Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 3 — PROTOCOL SPECS
      ════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", zIndex: 2, padding: "80px 0" }}>
        {/* top divider */}
        <div style={{
          height: 1, maxWidth: 1280, margin: "0 auto 60px",
          background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.3), rgba(20,241,149,0.3), transparent)",
        }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 20,
              background: "rgba(20,241,149,0.06)",
              border: "1px solid rgba(20,241,149,0.15)",
              marginBottom: 14,
            }}>
              <span style={{ color: "rgba(20,241,149,0.6)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em" }}>
                ◈ PROTOCOL ARCHITECTURE
              </span>
            </div>
            <h2 style={{
              margin: 0, color: "#fff",
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: 900, letterSpacing: "-0.01em",
            }}>
              Why <span style={{ color: "#9945FF" }}>BluPrint</span> Wins
            </h2>
            <p style={{
              marginTop: 10, color: "rgba(255,255,255,0.3)",
              fontFamily: "monospace", fontSize: 12, letterSpacing: "0.04em",
            }}>
              Engineered to outperform pump.fun and moonshot at every protocol layer.
            </p>
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {SPECS.map((spec, i) => (
              <motion.div
                key={spec.tag}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  background: "linear-gradient(135deg, rgba(153,69,255,0.06) 0%, rgba(7,7,15,0.9) 100%)",
                  border: `1px solid ${spec.accent}25`,
                  borderRadius: 18, padding: 28, position: "relative", overflow: "hidden",
                }}
              >
                {/* corner accent */}
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: 80, height: 80,
                  background: `radial-gradient(circle at top right, ${spec.accent}15 0%, transparent 70%)`,
                }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 1,
                  background: `linear-gradient(90deg, transparent, ${spec.accent}50, transparent)`,
                }} />

                <div style={{ position: "relative" }}>
                  {/* tag */}
                  <span style={{
                    color: `${spec.accent}80`, fontFamily: "monospace",
                    fontSize: 9, letterSpacing: "0.14em", display: "block", marginBottom: 14,
                  }}>{spec.tag}</span>

                  {/* icon */}
                  <div style={{
                    fontSize: 28, marginBottom: 14,
                    color: spec.accent,
                    filter: `drop-shadow(0 0 10px ${spec.accent}80)`,
                  }}>{spec.icon}</div>

                  <h3 style={{
                    margin: "0 0 10px", color: "#fff",
                    fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em",
                  }}>{spec.title}</h3>

                  <p style={{
                    margin: 0, color: "rgba(255,255,255,0.4)",
                    fontSize: 13, lineHeight: 1.7,
                  }}>{spec.body}</p>

                  {/* bottom metric line */}
                  <div style={{
                    marginTop: 20, paddingTop: 16,
                    borderTop: `1px solid ${spec.accent}15`,
                    display: "flex", gap: 20,
                  }}>
                    {[["< 10s", "DEPLOY TIME"], ["100%", "ON-CHAIN"], ["0%", "RUG RISK"]].map(([v, l]) => (
                      <div key={l}>
                        <p style={{ margin: 0, color: spec.accent, fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>{v}</p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer style={{ position: "relative", zIndex: 2, paddingTop: 60, paddingBottom: 40 }}>
        {/* divider */}
        <div style={{
          height: 1, maxWidth: 1280, margin: "0 auto 60px",
          background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.25), transparent)",
        }} />

        {/* ghost orca watermark */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          opacity: 0.04, pointerEvents: "none",
          fontSize: 320, lineHeight: 1, color: "#9945FF",
          fontWeight: 900, userSelect: "none", whiteSpace: "nowrap",
        }}>◈</div>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 24, marginBottom: 40,
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #9945FF, #14F195)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 16px rgba(153,69,255,0.4)",
                }}>B</div>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>BluPrint</span>
              </div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 11 }}>
                Solana's fastest bonding-curve launchpad
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: "X / Twitter", href: "#" },
                { label: "Telegram", href: "#" },
                { label: "Solscan", href: "#" },
                { label: "Developer Docs", href: "#" },
              ].map((link) => (
                <a key={link.label} href={link.href} style={{
                  color: "rgba(255,255,255,0.35)", textDecoration: "none",
                  fontFamily: "monospace", fontSize: 12, fontWeight: 600,
                  letterSpacing: "0.04em", transition: "color 0.15s",
                }}
                onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = "#14F195"; }}
                onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}
                >{link.label}</a>
              ))}
            </div>
          </div>

          {/* legal */}
          <div style={{
            borderTop: "1px solid rgba(153,69,255,0.1)",
            paddingTop: 20, textAlign: "center",
          }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.15)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em" }}>
              Securely powered by Solana Mainnet Live Core © 2026 BluPrint Protocol.
            </p>
          </div>
        </div>
      </footer>

      {/* ── GLOBAL KEYFRAMES ── */}
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(80px,60px)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-60px,80px)} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.8} 70%{transform:scale(2.5);opacity:0} 100%{transform:scale(1);opacity:0} }
        @keyframes borderFlow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 16px rgba(20,241,149,0.7)} 50%{box-shadow:0 0 30px rgba(20,241,149,1)} }
        @keyframes textPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @media (max-width:768px) {
          section > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}