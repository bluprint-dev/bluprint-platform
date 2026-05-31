"use client";

import Link from "next/link";

type HeaderProps = {
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export default function DexHeader({ onRefresh, isRefreshing }: HeaderProps) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(7,7,15,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(153,69,255,0.1)",
    }}>
      {/* top scan line */}
      <div style={{
        height: 1,
        background: "linear-gradient(90deg, transparent, #9945FF, #14F195, transparent)",
        opacity: 0.6,
      }} />

      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          textDecoration: "none",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #9945FF, #14F195)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff",
            boxShadow: "0 0 16px rgba(153,69,255,0.4)",
          }}>B</div>
          <div>
            <span style={{
              color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "0.04em",
            }}>BluPrint</span>
            <span style={{
              color: "rgba(153,69,255,0.6)", fontFamily: "monospace",
              fontSize: 9, display: "block", letterSpacing: "0.14em", marginTop: -2,
            }}>DEX_TERMINAL</span>
          </div>
        </Link>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* ── NETWORK PULSE ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: "rgba(20,241,149,0.05)",
            border: "1px solid rgba(20,241,149,0.15)",
            borderRadius: 20,
          }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#14F195",
                animation: "netPing 1.5s ease-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#14F195",
                boxShadow: "0 0 6px #14F195",
              }} />
            </div>
            <span style={{
              color: "#14F195", fontFamily: "monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            }}>SOL LIVE</span>
          </div>

          {/* Launch */}
          <Link href="/create" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, #9945FF, #6d28d9)",
            color: "#fff", textDecoration: "none",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
            boxShadow: "0 0 20px rgba(153,69,255,0.3)",
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 10 }}>⬡</span> LAUNCH
          </Link>

          {/* Refresh */}
          <button onClick={onRefresh} disabled={isRefreshing} style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(153,69,255,0.08)",
            border: "1px solid rgba(153,69,255,0.2)",
            color: "rgba(153,69,255,0.7)",
            cursor: isRefreshing ? "not-allowed" : "pointer",
            fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
            animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
          }}>↺</button>
        </div>
      </div>

      <style>{`
        @keyframes netPing {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}