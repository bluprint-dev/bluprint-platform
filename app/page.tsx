"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";

const MOCK_TOKENS = [
  { id: 1, name: "SolCat",     symbol: "SOLCAT",   cap: "$68.5K",  fill: 92, desc: "The internet's most degenerate feline, now living rent-free on Solana's fastest chain.", time: "2m",  replies: 312 },
  { id: 2, name: "PumpWhale",  symbol: "PMPWHL",   cap: "$41.2K",  fill: 74, desc: "Coordinated mass accumulation via bonding curve mechanics. Not financial advice.", time: "7m",  replies: 88  },
  { id: 3, name: "DegenMage",  symbol: "DGMAGE",   cap: "$29.8K",  fill: 55, desc: "On-chain wizard token. Spells are smart contracts. Your portfolio is the sacrifice.", time: "14m", replies: 54  },
  { id: 4, name: "RoboSol",    symbol: "RSOL",     cap: "$14.2K",  fill: 33, desc: "AI-piloted accumulation engine turned community governance token. The machine awakens.", time: "21m", replies: 27  },
  { id: 5, name: "NeonFrog",   symbol: "NFRG",     cap: "$9.1K",   fill: 21, desc: "Pepe's neon-drenched Solana cousin. Faster, cheaper, brighter.", time: "33m", replies: 19  },
  { id: 6, name: "VoidOracle", symbol: "VORACLE",  cap: "$4.4K",   fill: 9,  desc: "Sees the market before the market sees itself. On-chain divination for degen rituals.", time: "51m", replies: 8   },
];

const SPECS = [
  {
    tag: "COMPONENT 01",
    title: "Immutable Mint Engine",
    body: "Direct SPL token deployment via Metaplex token program. Fully permissionless, on-chain in under 10 seconds with immutable authority revocation.",
    accent: "#9945FF",
    metric: [["< 10s", "DEPLOY"], ["100%", "ON-CHAIN"], ["0", "ADMIN KEYS"]],
  },
  {
    tag: "COMPONENT 02",
    title: "Constant Product Curve",
    body: "Dynamic virtual liquidity reserves establish programmatic floor pricing. Mathematical invariant protects initial buyers from coordinated manipulation.",
    accent: "#14F195",
    metric: [["x·y=k", "FORMULA"], ["∞", "DEPTH"], ["0%", "SLIPPAGE CAP"]],
  },
  {
    tag: "COMPONENT 03",
    title: "Automated LP Burn Router",
    body: "At 100% curve capacity, all collected SOL migrates atomically to Raydium. Liquidity is permanently locked and LP tokens burned on-chain.",
    accent: "#9945FF",
    metric: [["AUTO", "MIGRATE"], ["BURN", "LP LOCK"], ["100%", "PERMLESS"]],
  },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Layer 1 — Titanium Outer Hull (purple armor) → drifts top-right, fades
  const l1x     = useTransform(scrollYProgress, [0, 0.6], [0, 160]);
  const l1y     = useTransform(scrollYProgress, [0, 0.6], [0, -120]);
  const l1scale = useTransform(scrollYProgress, [0, 0.6], [1, 1.2]);
  const l1op    = useTransform(scrollYProgress, [0, 0.5, 0.65], [1, 0.4, 0.08]);

  // Layer 2 — Cybernetic Sub-Systems (circuit arrays) → rotates, drifts bottom-left, neon glow
  const l2x      = useTransform(scrollYProgress, [0, 0.6], [0, -140]);
  const l2y      = useTransform(scrollYProgress, [0, 0.6], [0, 130]);
  const l2rot    = useTransform(scrollYProgress, [0, 0.6], [0, 15]);
  const l2op     = useTransform(scrollYProgress, [0, 0.15, 0.6, 0.7], [0.95, 1, 1, 0]);
  const l2filter = useTransform(scrollYProgress, [0, 0.4], ["drop-shadow(0 0 0px rgba(20,241,149,0))", "drop-shadow(0 0 40px rgba(20,241,149,0.8))"]);

  // Layer 3 — Quantum Core → stays center, scales down, brightens
  const l3scale  = useTransform(scrollYProgress, [0, 0.6], [1, 0.85]);
  const l3bright = useTransform(scrollYProgress, [0, 0.5], [1, 1.7]);
  const l3op     = useTransform(scrollYProgress, [0, 0.1, 0.65, 0.75], [0.7, 1, 1, 0]);

  // Badge fade-ins
  const badge1op = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);
  const badge1y  = useTransform(scrollYProgress, [0.1, 0.25], [24, 0]);
  const badge2op = useTransform(scrollYProgress, [0.25, 0.4], [0, 1]);
  const badge2y  = useTransform(scrollYProgress, [0.25, 0.4], [24, 0]);
  const badge3op = useTransform(scrollYProgress, [0.4, 0.55], [0, 1]);
  const badge3y  = useTransform(scrollYProgress, [0.4, 0.55], [24, 0]);

  // Headline fade
  const headlineOp = useTransform(scrollYProgress, [0, 0.05, 0.6, 0.72], [0, 1, 1, 0]);

  // Arena slides up
  const arenaOp = useTransform(scrollYProgress, [0.58, 0.75], [0, 1]);
  const arenaY  = useTransform(scrollYProgress, [0.58, 0.75], [60, 0]);

  return (
    <div style={{
      background: "linear-gradient(180deg, #07070f 0%, #0d0720 40%, #070714 100%)",
      overflowX: "hidden",
      fontFamily: "'Space Mono', 'Courier New', monospace",
    }}>

      {/* ── AMBIENT BLOBS ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "8%", left: "12%",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(153,69,255,0.08) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "8%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,241,149,0.06) 0%, transparent 65%)",
        }} />
        {/* scanline grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(153,69,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.02) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
      </div>

      {/* ════════════════════════════════════════════
          SECTION 1 — HERO + SCROLL TEARDOWN
      ════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position: "relative", zIndex: 1, height: "280vh" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

          {/* scan line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #9945FF 30%, #14F195 70%, transparent)", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #9945FF 30%, #14F195 70%, transparent)", opacity: 0.3 }} />

          {/* ── HEADLINE ── */}
          <motion.div style={{ opacity: headlineOp, textAlign: "center", marginBottom: 48, position: "relative", zIndex: 10 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 16px", borderRadius: 20, marginBottom: 20,
              background: "rgba(20,241,149,0.06)", border: "1px solid rgba(20,241,149,0.2)",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 8px #14F195", animation: "pulse 1.5s ease-in-out infinite" }} />
              <span style={{ color: "#14F195", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em" }}>SOLANA MAINNET LIVE</span>
            </div>

            <h1 style={{
              margin: 0, fontSize: "clamp(18px, 3vw, 26px)",
              fontWeight: 700, letterSpacing: "0.18em",
              background: "linear-gradient(90deg, #9945FF 0%, #c084fc 40%, #14F195 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              textTransform: "uppercase",
            }}>
              Welcome to the Newest Solana Ecosystem
            </h1>

            <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/create" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: 12,
                background: "linear-gradient(135deg, #14F195, #0fa96a)",
                color: "#07070f", textDecoration: "none",
                fontSize: 12, fontWeight: 900, letterSpacing: "0.1em",
                boxShadow: "0 0 28px rgba(20,241,149,0.4)",
              }}>⬡ LAUNCH TOKEN · 0.15 SOL</Link>
              <Link href="/dex" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: 12,
                background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.35)",
                color: "rgba(153,69,255,0.9)", textDecoration: "none",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
              }}>EXPLORE MARKETBOARD →</Link>
            </div>
          </motion.div>

          {/* ── ORCA TEARDOWN ── */}
          <div style={{ position: "relative", width: 380, height: 340 }}>

            {/* LAYER 1 — Titanium Hull */}
            <motion.div style={{
              position: "absolute", inset: 0,
              x: l1x, y: l1y, scale: l1scale, opacity: l1op,
              display: "flex", alignItems: "center", justifyContent: "center",
              mixBlendMode: "screen",
            }}>
              <Image src="/cyber-orca.png" alt="Hull" width={380} height={340} style={{ filter: "hue-rotate(0deg) saturate(1.4)" }} />
            </motion.div>

            {/* LAYER 2 — Cybernetic Sub-Systems */}
            <motion.div style={{
              position: "absolute", inset: 0,
              x: l2x, y: l2y, rotate: l2rot, opacity: l2op,
              filter: l2filter as any,
              display: "flex", alignItems: "center", justifyContent: "center",
              mixBlendMode: "screen",
            }}>
              <Image src="/cyber-orca.png" alt="Circuits" width={380} height={340} style={{ filter: "hue-rotate(120deg) saturate(2) brightness(1.3)" }} />
            </motion.div>

            {/* LAYER 3 — Quantum Core */}
            <motion.div style={{
              position: "absolute", inset: 0,
              scale: l3scale, opacity: l3op,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <motion.div style={{ filter: useTransform(l3bright, (v) => `brightness(${v})`) as any }}>
                <Image src="/cyber-orca.png" alt="Core" width={380} height={340} priority />
              </motion.div>
            </motion.div>
          </div>

          {/* ── TECH SPEC BADGES ── */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Badge 1 — top left */}
            <motion.div style={{ position: "absolute", top: "18%", left: "6%", opacity: badge1op, y: badge1y }}>
              <SpecBadge label="COMPONENT 01" value="IMMUTABLE MINT ENGINE" accent="#9945FF" />
            </motion.div>
            {/* Badge 2 — bottom left */}
            <motion.div style={{ position: "absolute", bottom: "20%", left: "4%", opacity: badge2op, y: badge2y }}>
              <SpecBadge label="COMPONENT 02" value="CONSTANT PRODUCT CURVE" accent="#14F195" />
            </motion.div>
            {/* Badge 3 — top right */}
            <motion.div style={{ position: "absolute", top: "22%", right: "4%", opacity: badge3op, y: badge3y }}>
              <SpecBadge label="COMPONENT 03" value="AUTOMATED LP BURN ROUTER" accent="#9945FF" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 2 — LIVE TOKEN ARENA
      ════════════════════════════════════════════ */}
      <motion.section style={{ position: "relative", zIndex: 2, padding: "80px 0 60px", opacity: arenaOp, y: arenaY }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>

          {/* section label */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 20, marginBottom: 16,
              background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.2)",
            }}>
              <span style={{ color: "rgba(153,69,255,0.7)", fontSize: 10, letterSpacing: "0.14em" }}>◈ LIVE TOKEN ARENA</span>
            </div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.01em" }}>
              The <span style={{ color: "#14F195" }}>Active</span> Launch Grid
            </h2>
          </div>

          {/* KING OF THE HILL */}
          <div style={{
            marginBottom: 32, borderRadius: 20, padding: 2,
            background: "linear-gradient(90deg, #9945FF, #14F195, #9945FF)",
            backgroundSize: "200% 100%",
            animation: "borderFlow 3s linear infinite",
          }}>
            <div style={{
              borderRadius: 18, padding: "24px 28px",
              background: "linear-gradient(135deg, rgba(153,69,255,0.08), rgba(7,7,15,0.98))",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 14 }}>👑</span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, letterSpacing: "0.14em" }}>KING OF THE HILL</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{
                  width: 68, height: 68, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #9945FF, #14F195)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 30px rgba(20,241,149,0.5)",
                }}>S</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>SolCat</span>
                    <span style={{
                      color: "#14F195", fontSize: 12, fontWeight: 700,
                      background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)",
                      padding: "2px 8px", borderRadius: 6,
                    }}>$SOLCAT</span>
                  </div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                    MKT CAP: <span style={{ color: "#14F195", fontWeight: 700 }}>$68,500</span>
                    <span style={{ marginLeft: 20 }}>HOLDERS: <span style={{ color: "#9945FF", fontWeight: 700 }}>892</span></span>
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: "0 0 6px", color: "#14F195", fontSize: 11, fontWeight: 700, animation: "textPulse 1.5s ease-in-out infinite" }}>
                    92% BONDING CURVE FILLED → MIGRATING TO RAYDIUM POOL
                  </p>
                  <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                    <div style={{
                      height: "100%", width: "92%", borderRadius: 4,
                      background: "linear-gradient(90deg, #9945FF, #14F195)",
                      boxShadow: "0 0 14px rgba(20,241,149,0.7)",
                      animation: "glowPulse 2s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROL BAR */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(153,69,255,0.5)", fontSize: 13, pointerEvents: "none" }}>›_</span>
              <input
                placeholder="Search token, ticker, mint address..."
                style={{
                  width: "100%", height: 44, paddingLeft: 38, paddingRight: 14,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(153,69,255,0.2)",
                  borderRadius: 10, color: "#fff", fontSize: 12,
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(20,241,149,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(20,241,149,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(153,69,255,0.2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            {["Newest", "Market Cap", "24h Volume", "Progress %"].map((f, i) => (
              <button key={f} style={{
                padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                background: i === 0 ? "rgba(153,69,255,0.15)" : "rgba(153,69,255,0.04)",
                border: `1px solid ${i === 0 ? "rgba(153,69,255,0.45)" : "rgba(153,69,255,0.12)"}`,
                color: i === 0 ? "rgba(153,69,255,0.9)" : "rgba(255,255,255,0.35)",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}>{f}</button>
            ))}
          </div>

          {/* TOKEN GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
            {MOCK_TOKENS.map((token, i) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(153,69,255,0.25)" }}
                style={{
                  background: "linear-gradient(135deg, rgba(153,69,255,0.06), rgba(7,7,15,0.95))",
                  border: "1px solid rgba(153,69,255,0.15)",
                  borderRadius: 16, overflow: "hidden", cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ padding: "14px 14px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #9945FF, #14F195)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 900, color: "#fff",
                      boxShadow: "0 0 10px rgba(153,69,255,0.4)",
                    }}>{token.symbol[0]}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{token.name}</span>
                        <span style={{
                          color: "#14F195", fontSize: 9, fontWeight: 700,
                          background: "rgba(20,241,149,0.07)", padding: "1px 5px", borderRadius: 4,
                        }}>${token.symbol}</span>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 10 }}>{token.time} ago</span>
                    </div>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, lineHeight: 1.6, marginBottom: 10, minHeight: 36 }}>{token.desc}</p>
                  <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.1em" }}>MKT CAP</p>
                      <p style={{ margin: 0, color: "#14F195", fontSize: 14, fontWeight: 700 }}>{token.cap}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.1em" }}>REPLIES</p>
                      <p style={{ margin: 0, color: "rgba(153,69,255,0.9)", fontSize: 14, fontWeight: 700 }}>{token.replies}</p>
                    </div>
                  </div>
                </div>
                {/* progress bar */}
                <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{
                    height: "100%", width: `${token.fill}%`,
                    background: token.fill > 80 ? "linear-gradient(90deg, #9945FF, #14F195)" : "linear-gradient(90deg, rgba(153,69,255,0.6), rgba(20,241,149,0.5))",
                    boxShadow: token.fill > 80 ? "0 0 8px rgba(20,241,149,0.7)" : "none",
                    transition: "width 1.2s ease",
                  }} />
                </div>
                <div style={{ padding: "4px 14px 10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 9 }}>CURVE FILL</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: token.fill > 80 ? "#14F195" : "rgba(153,69,255,0.7)" }}>
                    {token.fill}%{token.fill > 80 ? " → RAYDIUM" : ""}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Link href="/dex" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 12,
              background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.22)",
              color: "rgba(153,69,255,0.8)", textDecoration: "none",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            }}>VIEW ALL TOKENS →</Link>
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════
          SECTION 3 — PROTOCOL ARCHITECTURE
      ════════════════════════════════════════════ */}
      <section style={{ position: "relative", zIndex: 2, padding: "80px 0" }}>
        <div style={{ height: 1, maxWidth: 1280, margin: "0 auto 60px", background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.3), rgba(20,241,149,0.3), transparent)" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, marginBottom: 14, background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.15)" }}>
              <span style={{ color: "rgba(20,241,149,0.6)", fontSize: 10, letterSpacing: "0.14em" }}>◈ PROTOCOL ARCHITECTURE</span>
            </div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, letterSpacing: "-0.01em" }}>
              Why <span style={{ color: "#9945FF" }}>BluPrint</span> Wins
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
            {SPECS.map((spec, i) => (
              <motion.div
                key={spec.tag}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: "linear-gradient(135deg, rgba(153,69,255,0.05), rgba(7,7,15,0.95))",
                  border: `1px solid ${spec.accent}20`,
                  borderRadius: 18, padding: 26, position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${spec.accent}60, transparent)` }} />
                <span style={{ color: `${spec.accent}70`, fontSize: 9, letterSpacing: "0.16em", display: "block", marginBottom: 16 }}>{spec.tag}</span>
                <h3 style={{ margin: "0 0 10px", color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>{spec.title}</h3>
                <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.38)", fontSize: 13, lineHeight: 1.7 }}>{spec.body}</p>
                <div style={{ paddingTop: 16, borderTop: `1px solid ${spec.accent}12`, display: "flex", gap: 20 }}>
                  {spec.metric.map(([v, l]) => (
                    <div key={l}>
                      <p style={{ margin: 0, color: spec.accent, fontSize: 13, fontWeight: 700 }}>{v}</p>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: "0.1em" }}>{l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ position: "relative", zIndex: 2, paddingTop: 60, paddingBottom: 40 }}>
        <div style={{ height: 1, maxWidth: 1280, margin: "0 auto 50px", background: "linear-gradient(90deg, transparent, rgba(153,69,255,0.2), transparent)" }} />

        {/* ghost orca watermark */}
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", opacity: 0.03, pointerEvents: "none" }}>
          <Image src="/cyber-orca.png" alt="" width={600} height={540} style={{ filter: "grayscale(1)" }} />
        </div>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Image src="/cyber-orca.png" alt="BluPrint" width={40} height={36} />
              <div>
                <p style={{ margin: 0, color: "#fff", fontWeight: 900, fontSize: 16 }}>BluPrint</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.06em" }}>Solana's fastest bonding-curve launchpad</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[["X / Twitter", "#"], ["Telegram", "#"], ["Solscan", "#"], ["Developer Docs", "#"]].map(([label, href]) => (
                <a key={label as string} href={href as string} style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", transition: "color 0.15s" }}
                  onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = "#14F195"; }}
                  onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)"; }}
                >{label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(153,69,255,0.08)", paddingTop: 18, textAlign: "center" }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.12)", fontSize: 10, letterSpacing: "0.1em" }}>
              Securely powered by Solana Mainnet Live Core © 2026 BluPrint Protocol.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes borderFlow { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 14px rgba(20,241,149,0.7)} 50%{box-shadow:0 0 28px rgba(20,241,149,1)} }
        @keyframes textPulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
      `}</style>
    </div>
  );
}

function SpecBadge({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      padding: "8px 14px", borderRadius: 10,
      background: `${accent}08`, border: `1px solid ${accent}25`,
      backdropFilter: "blur(12px)",
    }}>
      <p style={{ margin: 0, color: `${accent}70`, fontSize: 9, letterSpacing: "0.14em", marginBottom: 3 }}>{label}</p>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>{value}</p>
    </div>
  );
}