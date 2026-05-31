"use client";

type StatsBarProps = {
  totalTokens: number;
  isLoading?: boolean;
};

const STATS = [
  { label: "LIVE_TOKENS", icon: "◈", color: "#9945FF" },
  { label: "CURVE_ENGINE", value: "ACTIVE", icon: "⬡", color: "#14F195" },
  { label: "NETWORK", value: "SOLANA", icon: "◎", color: "#9945FF" },
  { label: "LATENCY", value: "INSTANT", icon: "⚡", color: "#14F195" },
];

export default function StatsBar({ totalTokens, isLoading }: StatsBarProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 8,
    }}>
      {STATS.map((stat, i) => (
        <div key={stat.label} style={{
          background: "linear-gradient(135deg, rgba(153,69,255,0.06), rgba(20,241,149,0.03))",
          border: "1px solid rgba(153,69,255,0.12)",
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            fontSize: 18,
            color: stat.color,
            filter: `drop-shadow(0 0 6px ${stat.color}80)`,
            flexShrink: 0,
          }}>{stat.icon}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{
              color: "rgba(255,255,255,0.25)", fontFamily: "monospace",
              fontSize: 8, letterSpacing: "0.12em", margin: 0, marginBottom: 2,
            }}>{stat.label}</p>
            <p style={{
              color: stat.color, fontFamily: "monospace",
              fontSize: 13, fontWeight: 700, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {i === 0
                ? isLoading ? "···" : String(totalTokens)
                : stat.value}
            </p>
          </div>
          {/* pulse dot for active stats */}
          {(i === 1 || i === 3) && (
            <div style={{
              marginLeft: "auto",
              width: 6, height: 6, borderRadius: "50%",
              background: "#14F195",
              boxShadow: "0 0 8px #14F195",
              animation: "pulse 2s infinite",
              flexShrink: 0,
            }} />
          )}
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}