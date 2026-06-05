"use client";

import { useEffect, useRef } from "react";

const ITEMS = [
  { icon: "◈", text: "BLUPRINT.FUN IS LIVE" },
  { icon: "◆", text: "TOTAL FEE ONLY 0.95% — LOWEST IN THE GAME" },
  { icon: "◈", text: "FIRST 100 USERS MINT FOR JUST 0.05 SOL" },
  { icon: "◆", text: "ADVANCED BONDING CURVE & METAPLEX GENESIS" },
  { icon: "◈", text: "INNER SWAP ACTIVE — NO THIRD PARTY DEX NEEDED" },
  { icon: "◆", text: "INVITE FRIENDS & EARN 0.05 SOL INSTANTLY" },
  { icon: "◈", text: "1000 REFERRALS → +10 SOL BONUS & VIP UNLOCK" },
];

// Separator between items
const SEP = (
  <span
    style={{
      display: "inline-block",
      width: 6,
      height: 6,
      background: "linear-gradient(135deg, #9945FF, #14F195)",
      borderRadius: "50%",
      margin: "0 28px",
      verticalAlign: "middle",
      boxShadow: "0 0 8px #14F195, 0 0 16px #9945FF55",
      flexShrink: 0,
    }}
  />
);

function MarqueeTrack({ reversed = false }: { reversed?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = reversed ? -0.55 : 0.55;

    const tick = () => {
      posRef.current += speed;
      const half = track.scrollWidth / 2;
      if (posRef.current >= half) posRef.current -= half;
      if (posRef.current < 0) posRef.current += half;
      track.style.transform = `translateX(${-posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reversed]);

  const content = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      <div
        ref={trackRef}
        style={{
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {content.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            {/* Icon */}
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                color: i % 2 === 0 ? "#14F195" : "#9945FF",
                textShadow:
                  i % 2 === 0
                    ? "0 0 10px #14F195, 0 0 20px #14F19555"
                    : "0 0 10px #9945FF, 0 0 20px #9945FF55",
                marginRight: 8,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>

            {/* Text */}
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color:
                  i % 2 === 0
                    ? "rgba(20, 241, 149, 0.9)"
                    : "rgba(200, 170, 255, 0.85)",
                textShadow:
                  i % 2 === 0
                    ? "0 0 12px rgba(20,241,149,0.4)"
                    : "0 0 12px rgba(153,69,255,0.4)",
              }}
            >
              {item.text}
            </span>

            {SEP}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MarqueeBanner() {
  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(90deg, #0a0612 0%, #100820 40%, #0d0618 70%, #0a0612 100%)",
        borderBottom: "1px solid rgba(153,69,255,0.25)",
        userSelect: "none",
      }}
    >
      {/* Top shimmer line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, #9945FF 25%, #14F195 50%, #9945FF 75%, transparent 100%)",
          opacity: 0.7,
        }}
      />

      {/* Ambient glow left */}
      <div
        style={{
          position: "absolute",
          left: -40,
          top: "50%",
          transform: "translateY(-50%)",
          width: 120,
          height: 40,
          background: "radial-gradient(ellipse, rgba(153,69,255,0.35) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {/* Ambient glow right */}
      <div
        style={{
          position: "absolute",
          right: -40,
          top: "50%",
          transform: "translateY(-50%)",
          width: 120,
          height: 40,
          background: "radial-gradient(ellipse, rgba(20,241,149,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Left fade mask */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background:
            "linear-gradient(90deg, #0a0612 0%, transparent 100%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
      {/* Right fade mask */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background:
            "linear-gradient(270deg, #0a0612 0%, transparent 100%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Single marquee track */}
      <div style={{ padding: "9px 0" }}>
        <MarqueeTrack />
      </div>

      {/* Bottom shimmer line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, #14F195 25%, #9945FF 50%, #14F195 75%, transparent 100%)",
          opacity: 0.5,
        }}
      />

      <style>{`
        @keyframes shimmer-line {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}