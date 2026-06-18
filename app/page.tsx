"use client";

import { useState, useEffect, useRef } from "react";
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
    metrics: [["100%", "ON-CHAIN"], ["SPL", "STANDARD"], ["∞", "SUPPLY CTL"]],
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

const F = {
  display: "var(--font-outfit), 'Plus Jakarta Sans', system-ui, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
};

/* ── Activity Feed ───────────────────────────────────────────────────────────── */
const FAKE_WALLETS = [
  "7xKp...2MQr","3rNt...Qz8w","9fBw...Ly4k","5mJc...Vu1p","2sHd...Xo6n",
  "8nEa...Ri3s","4kGp...Se9t","6tCv...Bn2m","1yFq...Wm7j","0hDl...Zj5c",
  "AePk...3rXw","BtNw...7sKq","CxMj...5qPn","DvLi...9pMr","EuKh...2oNt",
  "FtJg...8nLs","GsIf...4mKp","HrHe...1lJo","IqGd...6kIn","JpFc...3jHm",
  "KoEb...9iGl","LnDa...7hFk","MmCz...5gEj","NlBx...2fDi","OkAw...8eCh",
  "PjZv...4dBg","QiYu...1cAf","RhXt...7bZe","SgWs...3aYd","TfVr...9zXc",
];
const FAKE_TOKENS_LIST = ["$LUK","$BONK2","$WIF3","$PEPE2","$MOON","$CHAD","$FROG","$BULL","$PUMP","$BASED","$DOGE3","$ORCA2","$BLUP","$NEIRO","$GOAT","$GIGA"];

type FeedKind = "trade" | "launch" | "referral" | "milestone" | "deposit";

interface FeedItem {
  id: number;
  wallet: string;
  kind: FeedKind;
  amount: number;
  token: string;
  milestone?: number;
  reward?: number;
}

function rndAmt(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
function pickItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const PRESET_FEED: FeedItem[] = Array.from({ length: 50 }, (_, i) => {
  const kinds: FeedKind[] = ["trade","trade","trade","launch","referral","milestone","deposit","trade","trade"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  return {
    id: i,
    wallet: FAKE_WALLETS[Math.floor(Math.random() * FAKE_WALLETS.length)],
    kind,
    amount: rndAmt(0.05, 5.5),
    token: FAKE_TOKENS_LIST[Math.floor(Math.random() * FAKE_TOKENS_LIST.length)],
    milestone: [100, 250, 500, 1000][Math.floor(Math.random() * 4)],
    reward: rndAmt(0.5, 3.0),
  };
});

function feedLine(item: FeedItem): { action: string; value: string } {
  switch (item.kind) {
    case "trade":    return { action: `${item.token} made a trade`,        value: `${item.amount} SOL` };
    case "launch":   return { action: `${item.token} launched token`,    value: `0.05 SOL` };
    case "referral": return { action: `claimed referral`,                 value: `${item.amount} SOL` };
    case "milestone":return { action: `${item.milestone} milestone reached`, value: `+${item.reward} SOL earned` };
    case "deposit":  return { action: `deposited`,                value: `${item.amount} SOL` };
  }
}

function LiveActivityFeed() {
  const [shown, setShown] = useState<FeedItem[]>(PRESET_FEED.slice(0, 6));
  const [cursor, setCursor] = useState(6);

  useEffect(() => {
    const iv = setInterval(() => {
      setCursor(c => {
        const next = c % PRESET_FEED.length;
        setShown(prev => [PRESET_FEED[next], ...prev].slice(0, 8));
        return next + 1;
      });
    }, 2600);
    return () => clearInterval(iv);
  }, []);

  const dotColor = (k: FeedKind) =>
    k === "launch" ? "#9945FF" : k === "milestone" ? "#f59e0b" : "#14F195";

  return (
    <div className="live-feed" style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 999,
      display: "flex", flexDirection: "column", gap: 5,
      width: 288, pointerEvents: "none",
    }}>
      <AnimatePresence initial={false}>
        {shown.map(item => {
          const { action, value } = feedLine(item);
          return (
            <motion.div key={item.id}
              className="live-feed-item"
              initial={{ opacity: 0, x: 50, scale: 0.93 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.88 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(8,3,18,0.95)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(20,241,149,0.12)", borderRadius: 10,
                padding: "7px 11px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                background: dotColor(item.kind),
                boxShadow: `0 0 5px ${dotColor(item.kind)}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 4, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span className="live-feed-text" style={{ fontFamily: F.mono, fontSize: 10, color: "#a78bfa", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {item.wallet}
                  </span>
                  <span className="live-feed-text" style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap" }}>
                    {action}
                  </span>
                </div>
                <div className="live-feed-value" style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 800, color: "#14F195", marginTop: 1 }}>
                  {value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── Viewer Count ────────────────────────────────────────────────────────────── */
function useViewerCount() {
  const [count, setCount] = useState(47);
  useEffect(() => {
    const iv = setInterval(() => {
      setCount(c => Math.max(30, c + Math.floor(Math.random() * 7) - 3));
    }, 3500);
    return () => clearInterval(iv);
  }, []);
  return count;
}

/* ── Slots Counter ───────────────────────────────────────────────────────────── */
function SlotsCounter() {
  const [slots, setSlots] = useState(0);
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      // %75 ihtimalle 3 saniye, %25 ihtimalle 5 saniye — organik/insansı ritim
      const delay = Math.random() < 0.25 ? 5000 : 3000;
      timeoutId = setTimeout(() => {
        setSlots(s => Math.min(500, s + 1));
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "10px 20px", borderRadius: 999,
      background: "rgba(255,80,80,0.07)",
      border: "1px solid rgba(255,80,80,0.25)",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "#ff5050", boxShadow: "0 0 8px #ff5050",
        display: "inline-block", animation: "ping2 1.2s ease-out infinite",
      }} />
      <span style={{
        fontFamily: F.mono, fontSize: 11, fontWeight: 700,
        color: "rgba(255,120,120,0.9)", letterSpacing: "0.1em",
      }}>
        <span style={{ color: "#ff5050", fontSize: 14 }}>{slots}</span> PEOPLE ARE BROWSING THE SITE RIGHT NOW
      </span>
    </div>
  );
}

/* ── Viewers Badge ───────────────────────────────────────────────────────────── */
function ViewersBadge({ count }: { count: number }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 14px", borderRadius: 999,
      background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.2)",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: "#9945FF", boxShadow: "0 0 6px #9945FF",
        display: "inline-block", animation: "ping2 1.8s ease-out infinite",
      }} />
      <span style={{
        fontFamily: F.mono, fontSize: 10, fontWeight: 700,
        color: "rgba(153,69,255,0.8)", letterSpacing: "0.1em",
      }}>
        {count} WATCHING NOW
      </span>
    </div>
  );
}

/* ── Launch Ticker ───────────────────────────────────────────────────────────── */
function LaunchTicker({ tokens }: { tokens: DexToken[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef   = useRef(0);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const tick = () => {
      posRef.current += 0.6;
      const half = track.scrollWidth / 2;
      if (posRef.current >= half) posRef.current -= half;
      track.style.transform = `translateX(${-posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const items = tokens.length > 0
    ? [...tokens, ...tokens]
    : Array.from({ length: 20 }, (_, i) => ({
        name: `TOKEN${i}`, symbol: `TKN${i}`, mint: `${i}`,
        imageUrl: "", creator: "", createdAt: 0,
      }));

  return (
    <div style={{
      overflow: "hidden", position: "relative",
      borderTop: "1px solid rgba(153,69,255,0.12)",
      borderBottom: "1px solid rgba(153,69,255,0.12)",
      background: "rgba(153,69,255,0.03)", padding: "10px 0",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(90deg,#0a0414,transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(270deg,#0a0414,transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div ref={trackRef} style={{ display: "inline-flex", alignItems: "center", gap: 0, whiteSpace: "nowrap", willChange: "transform" }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 28px" }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: i % 3 === 0 ? "#14F195" : i % 3 === 1 ? "#9945FF" : "#fff",
              display: "inline-block", opacity: 0.6,
            }} />
            <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: i % 2 === 0 ? "#14F195" : "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>
              ${t.symbol}
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>LIVE</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [tokens,       setTokens]      = useState<DexToken[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const [search,       setSearch]      = useState("");
  const viewers       = useViewerCount();
  const prevMintsRef  = useRef<Set<string>>(new Set());
  const [newMints,    setNewMints]     = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTokens = (initial = false) => {
      fetch("/api/bonding-curve/tokens")
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            const incoming: DexToken[] = data.tokens ?? [];
            if (!initial) {
              const fresh = incoming
                .filter(t => !prevMintsRef.current.has(t.mint))
                .map(t => t.mint);
              if (fresh.length > 0) {
                setNewMints(prev => new Set([...prev, ...fresh]));
                setTimeout(() => setNewMints(prev => {
                  const next = new Set(prev);
                  fresh.forEach(m => next.delete(m));
                  return next;
                }), 300000);
              }
            }
            prevMintsRef.current = new Set(incoming.map(t => t.mint));
            setTokens(incoming);
          }
        })
        .catch(() => {})
        .finally(() => { if (initial) setLoading(false); });
    };

    fetchTokens(true);
    const iv = setInterval(() => fetchTokens(false), 30000);
    return () => clearInterval(iv);
  }, []);

  const filtered = tokens.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.mint.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (activeFilter === 0) return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    return 0;
  });

  return (
    <div style={{
      minHeight: "100vh", color: "#fff", overflowX: "hidden",
      background: "linear-gradient(180deg, #0a0414 0%, #110820 35%, #0a0414 100%)",
      fontFamily: F.display,
    }}>
      <style>{`
        @keyframes borderFlow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes glowPulse  { 0%,100%{box-shadow:0 0 16px rgba(20,241,149,0.65)} 50%{box-shadow:0 0 32px rgba(20,241,149,1)} }
        @keyframes textPulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes float      { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
        @keyframes ping2      { 0%{transform:scale(1);opacity:0.8} 75%{transform:scale(2.2);opacity:0} 100%{transform:scale(1);opacity:0} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes urgentFlash {
          0%,100%{opacity:1;box-shadow:0 0 36px rgba(20,241,149,0.4),0 4px 20px rgba(20,241,149,0.2)}
          50%{opacity:0.85;box-shadow:0 0 56px rgba(20,241,149,0.7),0 4px 32px rgba(20,241,149,0.4)}
        }
        @keyframes scanline   { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        .tc { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .tc:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(153,69,255,0.22) !important; }
        .cta-pulse { animation: urgentFlash 2s ease-in-out infinite; }
        .cta-pulse:hover { animation: none !important; transform: translateY(-3px); box-shadow: 0 12px 48px rgba(20,241,149,0.6) !important; }

        @media (max-width: 640px) {
          .live-feed {
            width: 180px !important;
            right: 10px !important;
            bottom: 10px !important;
            gap: 4px !important;
          }
          .live-feed-item {
            padding: 5px 8px !important;
            gap: 6px !important;
            border-radius: 8px !important;
          }
          .live-feed-text {
            font-size: 8px !important;
          }
          .live-feed-value {
            font-size: 9px !important;
          }
        }
      `}</style>

      {/* GRID */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(153,69,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(153,69,255,0.022) 1px,transparent 1px)",
        backgroundSize: "56px 56px",
      }} />

      {/* BLOBS */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle,rgba(153,69,255,0.09) 0%,transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "30%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(20,241,149,0.06) 0%,transparent 65%)", filter: "blur(50px)" }} />
      </div>

      {/* Live toasts — bottom left */}
      <LiveActivityFeed />

      {/* ── HERO ── */}
      <section style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          <motion.div
            initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {/* badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "8px 16px", borderRadius: 999,
                background: "rgba(20,241,149,0.06)", border: "1px solid rgba(20,241,149,0.18)",
              }}>
                <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(20,241,149,0.55)", animation: "ping2 1.6s ease-out infinite" }} />
                  <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 6px #14F195" }} />
                </span>
                <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "#14F195" }}>
                  SOLANA MAINNET · LIVE NOW
                </span>
              </div>
              <ViewersBadge count={viewers} />
            </div>

            {/* headline */}
            <div>
              <h1 style={{ margin: 0, fontFamily: F.display, fontSize: "clamp(52px,5.5vw,82px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.03em", color: "#fff" }}>
                Launch Fast.<br />
                <span style={{ background: "linear-gradient(95deg,#9945FF 0%,#c084fc 45%,#14F195 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Trade Globally.
                </span>
              </h1>
              <p style={{ marginTop: 20, marginBottom: 0, fontFamily: F.display, fontSize: 16, fontWeight: 400, lineHeight: 1.75, maxWidth: 480, color: "rgba(255,255,255,0.45)" }}>
                The premium algorithmic bonding curve infrastructure on Solana. Built for pure transaction speed and automated Raydium pool migration.
              </p>
            </div>

            {/* urgency */}
            <SlotsCounter />

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/create" className="cta-pulse" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 34px", borderRadius: 14,
                background: "linear-gradient(135deg,#14F195,#0fa96a)",
                color: "#07070f", textDecoration: "none",
                fontFamily: F.display, fontSize: 15, fontWeight: 800,
                letterSpacing: "0.06em", position: "relative", overflow: "hidden",
              }}>
                <span style={{ position: "absolute", left: 0, right: 0, height: "30%", background: "linear-gradient(transparent,rgba(255,255,255,0.08),transparent)", animation: "scanline 2s linear infinite", pointerEvents: "none" }} />
                🚀 LAUNCH TOKEN · 0.15 SOL
              </Link>
              <Link href="/dex" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 28px", borderRadius: 14,
                background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.32)",
                color: "rgba(153,69,255,0.9)", textDecoration: "none",
                fontFamily: F.display, fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
              }}>
                VIEW TERMINAL →
              </Link>
            </div>

            {/* stats row */}
            <div style={{ display: "flex", gap: 40, paddingTop: 8, flexWrap: "wrap" }}>
              {[
                [tokens.length > 0 ? `${tokens.length}+` : "—", "TOKENS LIVE"],
                ["< 10s", "DEPLOY TIME"],
                ["100%", "ON-CHAIN"],
                ["0.60%", "TOTAL FEE"],
              ].map(([v, l]) => (
                <div key={String(l)}>
                  <p style={{ margin: 0, fontFamily: F.display, fontSize: 26, fontWeight: 900, color: l === "TOTAL FEE" ? "#14F195" : "#fff", letterSpacing: "-0.025em", lineHeight: 1 }}>{v}</p>
                  <p style={{ margin: "6px 0 0", fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)" }}>{l}</p>
                </div>
              ))}
            </div>

            {/* social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
              <div style={{ display: "flex" }}>
                {["#9945FF","#14F195","#c084fc","#0fa96a","#7c3aed"].map((c, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${c},rgba(10,4,22,0.8))`, border: "2px solid #0a0414", marginLeft: i === 0 ? 0 : -10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                    {["W","D","A","K","S"][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                <span style={{ color: "#fff", fontWeight: 700 }}>+{viewers} traders</span> active in the last hour
              </span>
            </div>
          </motion.div>

          {/* logo side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
          >
            <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(153,69,255,0.28) 0%,transparent 65%)", filter: "blur(56px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(20,241,149,0.18) 0%,transparent 65%)", filter: "blur(40px)", pointerEvents: "none", transform: "translate(40px,30px)" }} />
            <div style={{ animation: "float 5s ease-in-out infinite", position: "relative", zIndex: 10 }}>
              <img src="/favicon.ico" alt="BluPrint" style={{ width: 460, height: 460, objectFit: "contain", filter: "drop-shadow(0 0 60px rgba(153,69,255,0.55)) drop-shadow(0 0 100px rgba(20,241,149,0.3))" }} />
            </div>
            {/* orbit rings */}
            <div style={{ position: "absolute", width: 540, height: 540, borderRadius: "50%", border: "1px solid rgba(153,69,255,0.12)", animation: "spin 20s linear infinite", pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: -5, left: "50%", width: 10, height: 10, borderRadius: "50%", background: "#9945FF", boxShadow: "0 0 12px #9945FF", transform: "translateX(-50%)" }} />
            </div>
            <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(20,241,149,0.07)", animation: "spin 35s linear infinite reverse", pointerEvents: "none" }}>
              <div style={{ position: "absolute", bottom: -5, left: "50%", width: 8, height: 8, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 10px #14F195", transform: "translateX(-50%)" }} />
            </div>
          </motion.div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 128, pointerEvents: "none", background: "linear-gradient(to bottom,transparent,#0a0414)" }} />
      </section>

      {/* ── TICKER ── */}
      <LaunchTicker tokens={tokens} />

      {/* ── TOKEN GRID ── */}
      <section style={{ position: "relative", zIndex: 10, paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, marginBottom: 20, background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.18)" }}>
              <span style={{ fontFamily: F.mono, color: "rgba(153,69,255,0.65)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em" }}>◆ BLUEPRINT LIVE TRADING DESK</span>
            </div>
            <h2 style={{ margin: 0, fontFamily: F.display, fontSize: "clamp(32px,4vw,54px)", fontWeight: 900, letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.1 }}>
              The <span style={{ color: "#14F195" }}>Active</span> Launch Grid
            </h2>
            <p style={{ margin: "12px 0 0", fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              <span style={{ color: "#14F195", fontWeight: 700 }}>{Math.floor(viewers * 0.6)}</span> trades happening right now
            </p>
          </motion.div>

          {/* KING OF THE HILL */}
          {tokens.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ marginBottom: 32, borderRadius: 20, padding: "1.5px", background: "linear-gradient(90deg,#9945FF,#14F195,#9945FF)", backgroundSize: "300% 100%", animation: "borderFlow 3s linear infinite" }}>
              <div style={{ borderRadius: 18, padding: 24, background: "linear-gradient(135deg,rgba(153,69,255,0.08),rgba(10,4,16,0.98))" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>👑</span>
                    <span style={{ fontFamily: F.mono, color: "rgba(255,255,255,0.22)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em" }}>KING OF THE HILL</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 6px #14F195", display: "inline-block", animation: "ping2 1.4s ease-out infinite" }} />
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: "#14F195", fontWeight: 700, letterSpacing: "0.1em" }}>{Math.floor(viewers * 0.4)} PEOPLE WATCHING</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  {tokens[0].imageUrl
                    ? <img src={tokens[0].imageUrl} alt={tokens[0].name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 0 28px rgba(20,241,149,0.4)" }} />
                    : <div style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#9945FF,#14F195)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: F.display }}>{tokens[0].symbol?.[0] ?? "?"}</div>
                  }
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                      <span style={{ fontFamily: F.display, fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{tokens[0].name}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "#14F195", background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)", padding: "2px 8px", borderRadius: 6 }}>${tokens[0].symbol}</span>
                    </div>
                    <p style={{ margin: 0, fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{tokens[0].mint.slice(0,8)}...{tokens[0].mint.slice(-6)}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ margin: "0 0 8px", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "#14F195", animation: "textPulse 1.5s ease-in-out infinite" }}>LIVE ON BONDING CURVE → TRADE NOW</p>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ height: "100%", width: "68%", borderRadius: 4, background: "linear-gradient(90deg,#9945FF,#14F195)", animation: "glowPulse 2s ease-in-out infinite" }} />
                    </div>
                    <p style={{ margin: "6px 0 0", fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>68% filled · migrating to Raydium soon 🔥</p>
                  </div>
                  <Link href={`/dex?mint=${tokens[0].mint}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#14F195,#0fa96a)", color: "#07070f", textDecoration: "none", fontFamily: F.display, fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", flexShrink: 0 }}>
                    TRADE NOW →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* FILTERS */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(153,69,255,0.45)", fontSize: 13, fontFamily: F.mono, pointerEvents: "none" }}>›_</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search token, symbol, mint address..."
                style={{ width: "100%", height: 44, paddingLeft: 36, paddingRight: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(153,69,255,0.18)", borderRadius: 12, color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: F.mono }}
                onFocus={e => { e.target.style.borderColor = "rgba(20,241,149,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(20,241,149,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "rgba(153,69,255,0.18)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            {FILTERS.map((f, i) => (
              <button key={f} onClick={() => setActiveFilter(i)}
                style={{ padding: "10px 16px", borderRadius: 20, cursor: "pointer", background: activeFilter === i ? "rgba(153,69,255,0.14)" : "rgba(153,69,255,0.04)", border: `1px solid ${activeFilter === i ? "rgba(153,69,255,0.45)" : "rgba(153,69,255,0.12)"}`, color: activeFilter === i ? "rgba(153,69,255,0.95)" : "rgba(255,255,255,0.28)", fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                {f}
              </button>
            ))}
          </motion.div>

          {/* TOKEN GRID */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 96, paddingBottom: 96 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(153,69,255,0.3)", borderTopColor: "#9945FF", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                  <p style={{ fontFamily: F.mono, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Loading tokens...</p>
                </div>
              </motion.div>
            ) : sorted.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 96, paddingBottom: 96, textAlign: "center" }}>
                <div style={{ animation: "float 4s ease-in-out infinite", marginBottom: 28 }}>
                  <img src="/favicon.ico" alt="BluPrint" style={{ width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 30px rgba(153,69,255,0.5))", opacity: 0.85 }} />
                </div>
                <h3 style={{ margin: "0 0 10px", fontFamily: F.display, fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>No tokens yet.</h3>
                <p style={{ margin: "0 0 28px", fontFamily: F.display, fontSize: 15, color: "rgba(255,255,255,0.35)", maxWidth: 360, lineHeight: 1.7 }}>
                  Be the first to launch a token on BluPrint. Your coin will appear here live on the bonding curve seconds after creation.
                </p>
                <Link href="/create" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 14, background: "linear-gradient(135deg,#14F195,#0fa96a)", color: "#07070f", textDecoration: "none", fontFamily: F.display, fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", boxShadow: "0 0 36px rgba(20,241,149,0.4)" }}>
                  ⚡ CREATE THE FIRST TOKEN
                </Link>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                {sorted.map((token, i) => (
                  <motion.div key={token.mint}
                    initial={{ opacity: 0, y: newMints.has(token.mint) ? -40 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: newMints.has(token.mint) ? 0 : i * 0.05, type: newMints.has(token.mint) ? "spring" : "tween", stiffness: 260, damping: 20 }}
                    className="tc"
                    style={{
                      borderRadius: 20, overflow: "hidden", cursor: "pointer",
                      background: newMints.has(token.mint)
                        ? "linear-gradient(135deg,rgba(20,241,149,0.1),rgba(10,4,16,0.95))"
                        : "linear-gradient(135deg,rgba(153,69,255,0.07),rgba(10,4,16,0.95))",
                      border: newMints.has(token.mint)
                        ? "1px solid rgba(20,241,149,0.3)"
                        : "1px solid rgba(153,69,255,0.13)",
                      position: "relative",
                    }}>
                    {/* NEW badge */}
                    {newMints.has(token.mint) && (
                      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(20,241,149,0.15)", border: "1px solid rgba(20,241,149,0.4)", borderRadius: 999, padding: "3px 8px", zIndex: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 6px #14F195", display: "inline-block", animation: "ping2 1s ease-out infinite" }} />
                        <span style={{ fontFamily: "monospace", fontSize: 9, color: "#14F195", fontWeight: 700, letterSpacing: "0.1em" }}>NEW</span>
                      </div>
                    )}
                    {/* watching badge */}
                    {i < 3 && (
                      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(10,4,22,0.85)", border: "1px solid rgba(20,241,149,0.2)", borderRadius: 999, padding: "3px 8px" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 4px #14F195", display: "inline-block", animation: "ping2 2s ease-out infinite" }} />
                        <span style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(20,241,149,0.7)", fontWeight: 700 }}>{Math.floor(Math.random() * 12 + 3)} watching</span>
                      </div>
                    )}
                    <div style={{ padding: "16px 16px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        {token.imageUrl
                          ? <img src={token.imageUrl} alt={token.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 0 12px rgba(153,69,255,0.35)" }} />
                          : <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#9945FF,#14F195)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "#fff", fontFamily: F.display }}>{token.symbol?.[0] ?? "?"}</div>
                        }
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{token.name}</span>
                            {i === 0 && <span style={{ fontFamily: F.mono, fontSize: 8, fontWeight: 700, color: "#14F195", background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)", padding: "1px 5px", borderRadius: 4 }}>HOT</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: "#14F195" }}>${token.symbol}</span>
                            {token.createdAt && <span style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{getTimeAgo(token.createdAt)}</span>}
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: "0 0 12px", fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.22)", wordBreak: "break-all" }}>
                        {token.mint.slice(0,12)}...{token.mint.slice(-8)}
                      </p>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div>
                          <p style={{ margin: 0, fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)" }}>CREATOR</p>
                          <p style={{ margin: "3px 0 0", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "rgba(153,69,255,0.8)" }}>{token.creator ? `${token.creator.slice(0,6)}...` : "—"}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)" }}>STATUS</p>
                          <p style={{ margin: "3px 0 0", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "#14F195" }}>LIVE</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ height: "100%", width: "42%", background: "linear-gradient(90deg,rgba(153,69,255,0.7),rgba(20,241,149,0.6))" }} />
                    </div>
                    <div style={{ padding: "6px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)" }}>CURVE FILL</span>
                      <Link href={`/dex?mint=${token.mint}`} style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: "rgba(153,69,255,0.7)", textDecoration: "none" }}>TRADE →</Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {sorted.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/dex" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, background: "rgba(153,69,255,0.07)", border: "1px solid rgba(153,69,255,0.2)", color: "rgba(153,69,255,0.8)", textDecoration: "none", fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
                VIEW ALL TOKENS →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── SPECS ── */}
      <section style={{ position: "relative", zIndex: 10, paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ height: 1, maxWidth: 1280, margin: "0 auto 64px", background: "linear-gradient(90deg,transparent,rgba(153,69,255,0.28),rgba(20,241,149,0.28),transparent)" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, marginBottom: 16, background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.14)" }}>
              <span style={{ fontFamily: F.mono, color: "rgba(20,241,149,0.55)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em" }}>◆ PROTOCOL ARCHITECTURE</span>
            </div>
            <h2 style={{ margin: 0, fontFamily: F.display, fontSize: "clamp(30px,4vw,52px)", fontWeight: 900, letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.1 }}>
              Why <span style={{ color: "#9945FF" }}>BluPrint</span> Wins
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {SPECS.map((spec, i) => (
              <motion.div key={spec.tag}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: "linear-gradient(135deg,rgba(153,69,255,0.06),rgba(10,4,16,0.96))", border: `1px solid ${spec.accent}1a`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${spec.accent}55,transparent)` }} />
                <span style={{ display: "block", fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 18, color: `${spec.accent}70` }}>{spec.tag}</span>
                <h3 style={{ margin: "0 0 12px", fontFamily: F.display, fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.3 }}>{spec.title}</h3>
                <p style={{ margin: "0 0 22px", fontFamily: F.display, fontSize: 14, lineHeight: 1.78, color: "rgba(255,255,255,0.38)" }}>{spec.body}</p>
                <div style={{ paddingTop: 18, borderTop: `1px solid ${spec.accent}10`, display: "flex", gap: 22 }}>
                  {spec.metrics.map(([v, l]) => (
                    <div key={l}>
                      <p style={{ margin: 0, fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: spec.accent }}>{v}</p>
                      <p style={{ margin: "3px 0 0", fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>{l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: "relative", zIndex: 10, paddingTop: 56, paddingBottom: 40 }}>
        <div style={{ height: 1, maxWidth: 1280, margin: "0 auto 48px", background: "linear-gradient(90deg,transparent,rgba(153,69,255,0.18),transparent)" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/favicon.ico" alt="BluPrint" style={{ width: 38, height: 38, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(153,69,255,0.4))" }} />
              <div>
                <p style={{ margin: 0, fontFamily: F.display, fontSize: 17, fontWeight: 800, color: "#fff" }}>BluPrint</p>
                <p style={{ margin: 0, fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>The most profitable launchpad in Solana</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[["X / Twitter","#"],["Telegram","#"],["Docs","#"],["Solscan","#"]].map(([label, href]) => (
                <a key={String(label)} href={String(href)}
                  style={{ fontFamily: F.mono, color: "rgba(255,255,255,0.28)", textDecoration: "none", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}
                  onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = "#14F195"; }}
                  onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.28)"; }}
                >{label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(153,69,255,0.07)", paddingTop: 18, textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
              Securely powered by Solana Mainnet · © 2026 BluPrint Protocol.
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