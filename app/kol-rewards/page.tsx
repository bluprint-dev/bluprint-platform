"use client";

import { useState, useEffect, useRef } from "react";

// ─── MILESTONE DATA ──────────────────────────────────────────────────────────

const MILESTONES = [
  { followers: 0,    reward: 0,   label: "START",    color: "#9945FF" },
  { followers: 100,  reward: 5,   label: "+5 SOL",   color: "#9945FF" },
  { followers: 200,  reward: 5,   label: "+5 SOL",   color: "#a855f7" },
  { followers: 300,  reward: 5,   label: "+5 SOL",   color: "#b06cff" },
  { followers: 400,  reward: 5,   label: "+5 SOL",   color: "#bc83ff" },
  { followers: 500,  reward: 10,  label: "+10 SOL",  color: "#c99aff" },
  { followers: 600,  reward: 10,  label: "+10 SOL",  color: "#5eead4" },
  { followers: 700,  reward: 10,  label: "+10 SOL",  color: "#2dd4bf" },
  { followers: 800,  reward: 15,  label: "+15 SOL",  color: "#14e8aa" },
  { followers: 900,  reward: 15,  label: "+15 SOL",  color: "#14F195" },
  { followers: 1000, reward: 20,  label: "+20 SOL 👑", color: "#FFD700", isVip: true },
];

// winding path: alternates left→right, right→left across rows
const COLS  = 5;
const ROWS  = Math.ceil(MILESTONES.length / COLS);

function getGridPos(index: number): { col: number; row: number } {
  const row = Math.floor(index / COLS);
  const col = row % 2 === 0 ? index % COLS : COLS - 1 - (index % COLS);
  return { col, row };
}

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display}</>;
}

// ─── SVG WINDING PATH ────────────────────────────────────────────────────────

function WindingPath({ reached }: { reached: number }) {
  // Grid cell size in SVG units
  const CW = 160, CH = 110;
  const W  = COLS * CW;
  const H  = ROWS * CH;

  // Build path points for each milestone
  const points = MILESTONES.map((_, i) => {
    const { col, row } = getGridPos(i);
    return {
      x: col * CW + CW / 2,
      y: row * CH + CH / 2,
    };
  });

  // Build smooth SVG path through all points
  function smoothPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      // cubic bezier — control points pulled toward horizontal midpoint
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  const pathD = smoothPath(points);

  // Split into reached vs unreached segments
  const reachedPoints  = points.slice(0, Math.min(reached + 1, points.length));
  const reachedPathD   = smoothPath(reachedPoints);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowStrong">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Base path (dim) */}
      <path d={pathD} fill="none" stroke="rgba(153,69,255,0.12)" strokeWidth="3" strokeLinecap="round" />

      {/* Reached path */}
      {reached > 0 && (
        <path
          d={reachedPathD}
          fill="none"
          stroke="url(#pathGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      )}

      {/* Milestone dots */}
      {MILESTONES.map((m, i) => {
        const { x, y } = points[i];
        const isReached = i < reached;
        const isCurrent = i === reached;
        const isVip     = m.isVip;

        return (
          <g key={i}>
            {/* Outer ring for current */}
            {isCurrent && (
              <circle cx={x} cy={y} r={18} fill="none"
                stroke="rgba(153,69,255,0.25)" strokeWidth="1"
                style={{ animation: "ringPulse 1.8s ease-in-out infinite" }}
              />
            )}
            {/* VIP outer ring */}
            {isVip && isReached && (
              <circle cx={x} cy={y} r={20} fill="none"
                stroke="rgba(255,215,0,0.3)" strokeWidth="1.5"
                style={{ animation: "ringPulse 2s ease-in-out infinite" }}
              />
            )}

            {/* Main dot */}
            <circle
              cx={x} cy={y}
              r={isCurrent ? 10 : isVip ? 12 : 8}
              fill={isReached ? m.color : isVip ? "#FFD700" : "#0F0817"}
              stroke={isReached ? m.color : isCurrent ? "#9945FF" : isVip ? "#FFD700" : "rgba(153,69,255,0.3)"}
              strokeWidth={isCurrent || isVip ? 2 : 1.5}
              filter={isReached || isCurrent ? "url(#glowStrong)" : undefined}
              style={{ transition: "all 0.4s ease" }}
            />

            {/* Checkmark for reached */}
            {isReached && !isVip && (
              <text x={x} y={y + 4} textAnchor="middle"
                fill="#0F0817" fontSize="9" fontWeight="900" fontFamily="monospace"
              >✓</text>
            )}
            {isVip && isReached && (
              <text x={x} y={y + 5} textAnchor="middle" fontSize="11">👑</text>
            )}

            {/* Follower count label */}
            <text
              x={x} y={y - 18}
              textAnchor="middle"
              fill={isReached ? m.color : isCurrent ? "#9945FF" : "rgba(255,255,255,0.3)"}
              fontSize="9" fontWeight="700" fontFamily="'Space Grotesk', sans-serif"
              letterSpacing="0.04em"
            >
              {m.followers === 0 ? "START" : m.followers}
            </text>

            {/* Reward label */}
            {m.followers > 0 && (
              <text
                x={x} y={y + 26}
                textAnchor="middle"
                fill={isVip ? "#FFD700" : isReached ? "#14F195" : "rgba(255,255,255,0.2)"}
                fontSize="9" fontWeight="700" fontFamily="'Space Grotesk', sans-serif"
              >
                {m.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function KolRewardsPage() {
  // Demo: simulate progress — replace with real data from your API
  const currentFollowers = 0;
  const reached = MILESTONES.filter(m => currentFollowers >= m.followers).length - 1;
  const nextMilestone = MILESTONES.find(m => currentFollowers < m.followers) ?? null;
  const toNext = nextMilestone ? nextMilestone.followers - currentFollowers : 0;
  const totalRewardSol = MILESTONES.reduce((s, m) => s + m.reward, 0);

  const handleApply = () => {
    window.open("https://x.com/BluprintFun", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0F0817]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap');

        :root {
          --purple: #9945FF;
          --green: #14F195;
          --dark: #0F0817;
        }

        .glow-text-green  { text-shadow: 0 0 20px rgba(20,241,149,0.6); }
        .glow-text-purple { text-shadow: 0 0 20px rgba(153,69,255,0.6); }

        .glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(153,69,255,0.2);
          border-radius: 16px;
        }

        .bg-mesh {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0; overflow: hidden;
        }
        .mesh-blob {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.12;
        }

        .stat-value {
          font-family: 'Orbitron', monospace;
          font-weight: 700; font-size: 28px; line-height: 1;
        }

        /* Winding path SVG animations */
        @keyframes ringPulse {
          0%, 100% { opacity: 0.4; r: 18; }
          50%       { opacity: 0;   r: 26; }
        }
        @keyframes badgePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes vip-shimmer {
          0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.3); }
          50%       { box-shadow: 0 0 20px rgba(255,215,0,0.7), 0 0 30px rgba(153,69,255,0.4); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .apply-btn {
          background: linear-gradient(135deg, #9945FF, #14F195);
          border: none; border-radius: 12px;
          color: #0F0817; font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 15px; cursor: pointer;
          transition: all 0.2s; position: relative; overflow: hidden;
          display: flex; align-items: center; gap: 10px;
          padding: 14px 28px;
        }
        .apply-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 8px 32px rgba(153,69,255,0.35); }
        .apply-btn:active { transform: translateY(0) scale(0.98); }

        .req-card {
          background: rgba(153,69,255,0.04);
          border: 1px solid rgba(153,69,255,0.15);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex; align-items: flex-start; gap: 14px;
          transition: all 0.2s;
        }
        .req-card:hover {
          background: rgba(153,69,255,0.08);
          border-color: rgba(153,69,255,0.3);
          transform: translateX(4px);
        }

        .progress-bar-track {
          height: 6px; border-radius: 6px;
          background: rgba(255,255,255,0.06);
          overflow: hidden; position: relative;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #9945FF, #14F195);
          border-radius: 6px;
          box-shadow: 0 0 12px rgba(20,241,149,0.4);
          transition: width 1.2s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>

      {/* Background mesh — identical to referral */}
      <div className="bg-mesh">
        <div className="mesh-blob" style={{ width: 600, height: 600, background: "#9945FF", top: -100, left: -200 }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, background: "#14F195", bottom: 0, right: -100 }} />
        <div className="mesh-blob" style={{ width: 400, height: 400, background: "#9945FF", top: "50%", left: "40%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px 100px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 40, animation: "slideUp 0.5s ease both" }}>
          <p style={{ color: "#9945FF", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>
            BluPrint
          </p>
          <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(24px, 5vw, 38px)", fontWeight: 900, color: "#fff", margin: "0 0 12px", lineHeight: 1.1 }}>
            KOL <span style={{ color: "#14F195" }} className="glow-text-green">Rewards</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: 0, maxWidth: 520 }}>
            Grow with BluPrint. Reach follower milestones → earn SOL rewards. Up to <span style={{ color: "#14F195", fontWeight: 600 }}>{totalRewardSol} SOL</span> total available.
          </p>
        </div>

        {/* ── PROGRESS HEADER CARD ── */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 24, animation: "slideUp 0.55s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>
              YOUR PROGRESS
            </h3>
            {nextMilestone ? (
              <div style={{
                background: "rgba(20,241,149,0.08)", border: "1px solid rgba(20,241,149,0.25)",
                borderRadius: 20, padding: "6px 16px",
                color: "#14F195", fontSize: 13, fontWeight: 600,
              }}>
                ⚡ {toNext} more followers to unlock {nextMilestone.label}
              </div>
            ) : (
              <div style={{
                background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.4)",
                borderRadius: 20, padding: "6px 16px",
                color: "#FFD700", fontSize: 13, fontWeight: 600,
              }}>
                🏆 All milestones reached!
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 900, color: "#9945FF" }} className="glow-text-purple">
              <AnimatedCounter value={currentFollowers} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${(currentFollowers / 1000) * 100}%` }} />
              </div>
            </div>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,0.2)" }}>
              1000
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>followers</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>goal</span>
          </div>
        </div>

        {/* ── WINDING ROADMAP ── */}
        <div className="glass-card" style={{ padding: "28px 20px 32px", marginBottom: 24, animation: "slideUp 0.6s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>
              MILESTONE ROADMAP
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 8px #14F195" }} />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Reached</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9945FF", animation: "badgePulse 1.5s infinite" }} />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Current</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(153,69,255,0.3)", border: "1px solid rgba(153,69,255,0.4)" }} />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Locked</span>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 8px" }}>
            <WindingPath reached={reached} />
          </div>

          {/* VIP banner */}
          <div style={{
            marginTop: 20,
            background: "linear-gradient(135deg, rgba(255,215,0,0.05), rgba(153,69,255,0.08))",
            border: "1px solid rgba(255,215,0,0.2)",
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(153,69,255,0.15))",
              border: "1px solid rgba(255,215,0,0.4)", borderRadius: "50%",
              width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, animation: "vip-shimmer 2s ease-in-out infinite", flexShrink: 0,
            }}>👑</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#FFD700", fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>
                1000 Followers — VIP Status + 20 SOL
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
                Reach 1000 followers and contact us directly for exclusive VIP perks & partnerships
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 900, color: "#FFD700" }}>
                <AnimatedCounter value={currentFollowers} />
              </span>
              <span style={{ color: "rgba(255,215,0,0.4)", fontSize: 13 }}> / 1000</span>
            </div>
          </div>
        </div>

        {/* ── REQUIREMENTS ── */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 24, animation: "slideUp 0.65s ease both" }}>
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 20px", letterSpacing: "0.05em" }}>
            REQUIREMENTS
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9945FF" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                  </svg>
                ),
                color: "rgba(153,69,255,0.12)",
                borderColor: "rgba(153,69,255,0.2)",
                title: "Organic Audience",
                desc: "2,000 – 200,000 organic followers. No bots, no purchased followers.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                color: "rgba(20,241,149,0.08)",
                borderColor: "rgba(20,241,149,0.2)",
                title: "Consistent Activity",
                desc: "Regular posting schedule. Active engagement with your community every week.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                color: "rgba(14,165,233,0.08)",
                borderColor: "rgba(14,165,233,0.2)",
                title: "High Engagement",
                desc: "Genuine interaction — replies, retweets, and conversations. Quality over quantity.",
              },
            ].map((req, i) => (
              <div key={i} className="req-card" style={{ borderColor: req.borderColor }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: req.color, border: `1px solid ${req.borderColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {req.icon}
                </div>
                <div>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{req.title}</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>{req.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW TO JOIN ── */}
        <div className="glass-card" style={{ padding: 28, animation: "slideUp 0.7s ease both" }}>
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 8px", letterSpacing: "0.05em" }}>
            HOW TO JOIN
          </h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
            Think you qualify? Tweet us directly and we'll review your profile within 48 hours. Include your wallet address and a brief intro.
          </p>

          <button className="apply-btn" onClick={handleApply}>
            {/* X / Twitter icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F0817">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.264 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Apply on X
          </button>

          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, margin: "16px 0 0" }}>
            Clicking will open a pre-filled tweet to <span style={{ color: "rgba(153,69,255,0.6)" }}>@BluPrintFun</span>. Edit it before posting if you like.
          </p>
        </div>

      </div>
    </div>
  );
}