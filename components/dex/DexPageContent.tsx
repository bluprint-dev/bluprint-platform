"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DexHeader from "@/components/dex/Header";
import TradePanel from "@/components/dex/TradePanel";
import TradeChart from "@/components/dex/TradeChart";
import { useDexTokens } from "@/hooks/useDexTokens";
import { useBondingCurveInfo } from "@/hooks/useBondingCurveInfo";
import { useSwap } from "@/hooks/useSwap";
import { useDexStore } from "@/store/dexStore";
import { filterTokens } from "@/lib/dex/normalizeToken";
import { useTrades } from "@/hooks/useTrades";
import type { DexToken } from "@/types/dex";
import type { Trade } from "@/hooks/useTrades";

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmt(n: number, dec = 4) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(dec);
}

function fmtAge(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function fmtMcap(mcapSol: number, solPrice = 145) {
  const usd = mcapSol * solPrice;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

const SOL_PRICE_USD = 145;
const TOTAL_SUPPLY = 1_000_000_000;

// â”€â”€â”€ GLOBAL STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --purple: #9945FF;
    --green: #14F195;
    --pink: #ff2d95;
    --dark: #080612;
    --card: rgba(255,255,255,0.035);
    --border: rgba(153,69,255,0.18);
    --border-green: rgba(20,241,149,0.22);
    --text-muted: rgba(255,255,255,0.35);
  }

  .glass {
    background: rgba(255,255,255,0.035);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(153,69,255,0.18);
    border-radius: 16px;
  }

  .dex-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(153,69,255,0.22);
    border-radius: 12px;
    color: #fff;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    padding: 12px 16px 12px 42px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .dex-input:focus {
    border-color: rgba(153,69,255,0.5);
    box-shadow: 0 0 0 3px rgba(153,69,255,0.08);
  }
  .dex-input::placeholder { color: rgba(153,69,255,0.3); }

  .skeleton {
    background: linear-gradient(90deg, rgba(153,69,255,0.05) 25%, rgba(153,69,255,0.1) 50%, rgba(153,69,255,0.05) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
  }

  /* scrollbar */
  .dex-scroll::-webkit-scrollbar { width: 3px; }
  .dex-scroll::-webkit-scrollbar-track { background: transparent; }
  .dex-scroll::-webkit-scrollbar-thumb { background: rgba(153,69,255,0.2); border-radius: 2px; }

  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cardIn  { from{opacity:0;transform:translateY(-8px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes popIn   { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes rotate  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes glow    { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes copyPop { from{transform:scale(0.92)} to{transform:scale(1)} }

  /* Token card hover */
  .token-card {
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s, border-color 0.22s;
    border: 1px solid rgba(153,69,255,0.15);
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255,255,255,0.03);
    position: relative;
  }
  .token-card:hover {
    transform: translateY(-5px) scale(1.015);
    border-color: rgba(153,69,255,0.4);
    box-shadow: 0 8px 32px rgba(153,69,255,0.18), 0 2px 8px rgba(0,0,0,0.4);
  }

  /* Stat chip */
  .stat-chip {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 18px;
    border-right: 1px solid rgba(153,69,255,0.07);
  }

  /* Tab btn */
  .tab-btn {
    padding: 11px 18px;
    border: none;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    background: transparent;
    transition: color 0.15s;
    display: flex;
    align-items: center;
    gap: 7px;
    position: relative;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .detail-layout { flex-direction: column !important; height: auto !important; overflow: auto !important; }
    .detail-left   { min-height: 0 !important; flex: none !important; }
    .detail-right  { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(153,69,255,0.1) !important; }
    .chart-area    { height: 260px !important; min-height: 260px !important; }
    .tabs-area     { height: auto !important; }
    .tabs-scroll   { height: 220px !important; }
    .top-bar       { flex-wrap: wrap !important; gap: 8px !important; height: auto !important; padding: 10px 14px !important; }
    .top-bar-stats { display: none !important; }
    .token-grid    { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 10px !important; }
    .search-row    { flex-wrap: wrap !important; gap: 8px !important; }
    .search-row > * { flex: 1 1 auto !important; min-width: 0 !important; }
    .trade-row-grid { grid-template-columns: 46px 1fr 1fr 36px !important; }
    .trade-row-mcap, .trade-row-maker { display: none !important; }
    .trade-head-mcap, .trade-head-maker { display: none !important; }
    .stat-chip { padding: 0 10px !important; }
    .page-pad  { padding: 20px 14px 80px !important; }
    .back-btn-label { display: none !important; }
  }
  @media (max-width: 480px) {
    .token-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;

// â”€â”€â”€ BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Deep base */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(153,69,255,0.12) 0%, transparent 70%)" }} />
      {/* Animated blobs */}
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(153,69,255,0.08) 0%, transparent 70%)",
        top: -200, left: -200, animation: "float 18s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(20,241,149,0.06) 0%, transparent 70%)",
        bottom: -100, right: -100, animation: "float 22s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(153,69,255,0.05) 0%, transparent 70%)",
        top: "45%", left: "55%", animation: "float 28s ease-in-out infinite 6s",
      }} />
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(153,69,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
}

// â”€â”€â”€ TOKEN AVATAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TokenAvatar({ token, size = 48 }: { token: DexToken; size?: number }) {
  const grads = ["#9945FF,#14F195", "#ff2d95,#9945FF", "#14F195,#0ea5e9", "#f59e0b,#ff2d95"];
  const grad = grads[(token.symbol.charCodeAt(0) ?? 0) % grads.length];
  if (token.imageUrl) {
    return (
      <img
        src={token.imageUrl}
        alt={token.symbol}
        style={{ width: size, height: size, borderRadius: size * 0.28, objectFit: "cover", flexShrink: 0 }}
        loading="lazy"
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: `linear-gradient(135deg, ${grad})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 900, color: "#fff",
      fontFamily: "'Orbitron', monospace",
    }}>
      {token.symbol.charAt(0)}
    </div>
  );
}

// â”€â”€â”€ TOKEN CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TokenCard({ token, isNew, onClick }: { token: DexToken; isNew: boolean; onClick: () => void }) {
  const age = token.createdAt ? Date.now() - token.createdAt : null;

  return (
    <div
      className="token-card"
      onClick={onClick}
      style={{ animation: isNew ? "cardIn 0.45s cubic-bezier(0.16,1,0.3,1)" : undefined }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "62%", background: "rgba(153,69,255,0.04)" }}>
        {token.imageUrl ? (
          <img
            src={token.imageUrl}
            alt={token.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(145deg, rgba(153,69,255,0.1), rgba(20,241,149,0.05))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Orbitron', monospace", fontSize: 44, fontWeight: 900,
            color: "rgba(153,69,255,0.25)",
          }}>
            {token.symbol.charAt(0)}
          </div>
        )}

        {/* Badges */}
        {isNew && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "linear-gradient(135deg, #9945FF, #14F195)",
            borderRadius: 6, padding: "3px 9px",
            fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            color: "#080612", letterSpacing: "0.1em",
            animation: "popIn 0.4s cubic-bezier(0.16,1,0.3,1), pulse 1.8s ease-in-out 0.4s infinite",
            boxShadow: "0 0 16px rgba(153,69,255,0.5)",
          }}>âœ¦ NEW</div>
        )}
        {age !== null && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(8,6,18,0.8)", backdropFilter: "blur(8px)",
            borderRadius: 6, padding: "3px 8px",
            fontSize: 9, color: "rgba(255,255,255,0.4)",
            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.04em",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>{fmtAge(age)}</div>
        )}

        {/* Bottom gradient */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(8,6,18,0.92) 0%, transparent 100%)",
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px", fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <span style={{
            color: "#fff", fontWeight: 700, fontSize: 13,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {token.name}
          </span>
          <span style={{
            color: "#14F195", fontSize: 9, fontWeight: 700,
            background: "rgba(20,241,149,0.08)", border: "1px solid rgba(20,241,149,0.18)",
            padding: "2px 7px", borderRadius: 5, flexShrink: 0, letterSpacing: "0.05em",
          }}>${token.symbol}</span>
        </div>
        <div style={{
          color: "rgba(255,255,255,0.18)", fontSize: 10, letterSpacing: "0.04em",
          fontFamily: "monospace",
        }}>
          {token.mint.slice(0, 6)}Â·Â·Â·{token.mint.slice(-4)}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ LIVE TRADE ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TradeRow({ trade, isNew }: { trade: Trade; isNew: boolean }) {
  const age = Date.now() - new Date(trade.created_at).getTime();
  const mcapSol = trade.price * TOTAL_SUPPLY;

  return (
    <div
      className="trade-row-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "52px 1fr 1fr 42px 1fr 88px",
        padding: "9px 18px",
        borderBottom: "1px solid rgba(153,69,255,0.04)",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Space Grotesk', sans-serif",
        background: isNew
          ? trade.is_buy ? "rgba(20,241,149,0.03)" : "rgba(255,45,149,0.03)"
          : "transparent",
        transition: "background 1.8s ease",
        animation: isNew ? "slideIn 0.3s cubic-bezier(0.16,1,0.3,1)" : undefined,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(153,69,255,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "4px 0", borderRadius: 6,
        background: trade.is_buy ? "rgba(20,241,149,0.09)" : "rgba(255,45,149,0.09)",
        border: `1px solid ${trade.is_buy ? "rgba(20,241,149,0.2)" : "rgba(255,45,149,0.2)"}`,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800,
          color: trade.is_buy ? "#14F195" : "#ff2d95",
          letterSpacing: "0.08em",
        }}>
          {trade.is_buy ? "BUY" : "SELL"}
        </span>
      </div>

      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
        {trade.amount_sol.toFixed(4)}
        <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 9, marginLeft: 3 }}>SOL</span>
      </span>

      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
        {fmt(trade.amount_token, 0)}
      </span>

      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "right" }}>
        {fmtAge(age)}
      </span>

      <span className="trade-row-mcap" style={{ fontSize: 10, color: "rgba(153,69,255,0.65)", fontWeight: 600 }}>
        {mcapSol > 0 ? fmtMcap(mcapSol) : "â€”"}
      </span>

      <a
        className="trade-row-maker"
        href={trade.tx_signature ? `https://solscan.io/tx/${trade.tx_signature}` : "#"}
        target="_blank" rel="noopener noreferrer"
        style={{
          fontSize: 10, color: "rgba(153,69,255,0.4)",
          textDecoration: "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => ((e.target as HTMLElement).style.color = "#9945FF")}
        onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(153,69,255,0.4)")}
      >
        {trade.wallet.slice(0, 4)}Â·Â·Â·{trade.wallet.slice(-4)} â†—
      </a>
    </div>
  );
}

// â”€â”€â”€ HOLDERS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HoldersTab({ mint }: { mint: string }) {
  const [holders, setHolders] = useState<{ address: string; amount: number; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
fetch(process.env.NEXT_PUBLIC_RPC_URL ?? "https://mainnet.helius-rpc.com/?api-key=fdbb8762-06b5-4bbd-ab1e-33310587e2d4", {      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: "holders",
        method: "getTokenLargestAccounts",
        params: [mint],
      }),
    })
      .then(r => r.json())
      .then(data => {
        const accounts = data?.result?.value ?? [];
        const total = accounts.reduce((s: number, a: any) => s + Number(a.uiAmount ?? 0), 0);
        setHolders(accounts.slice(0, 20).map((a: any) => ({
          address: a.address,
          amount: Number(a.uiAmount ?? 0),
          pct: total > 0 ? (Number(a.uiAmount ?? 0) / total) * 100 : 0,
        })));
      })
      .catch(() => setHolders([]))
      .finally(() => setLoading(false));
  }, [mint]);

  if (loading) {
    return (
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 42, borderRadius: 10, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.12, color: "#9945FF" }}>â—ˆ</div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}>
          No holder data available
        </div>
      </div>
    );
  }

  const top3Colors = ["#14F195", "#9945FF", "#0ea5e9"];

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "32px 1fr 90px 130px",
        padding: "8px 18px 10px",
        borderBottom: "1px solid rgba(153,69,255,0.06)",
        gap: 8,
      }}>
        {["#", "WALLET", "TOKENS", "SHARE"].map(h => (
          <span key={h} style={{
            color: "rgba(153,69,255,0.3)", fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 9, letterSpacing: "0.12em", fontWeight: 700,
          }}>{h}</span>
        ))}
      </div>

      {holders.map((h, i) => {
        const rankColor = i < 3 ? top3Colors[i] : "rgba(255,255,255,0.15)";
        const isTop = i < 3;
        return (
          <div key={h.address} style={{
            display: "grid", gridTemplateColumns: "32px 1fr 90px 130px",
            padding: "9px 18px",
            borderBottom: "1px solid rgba(153,69,255,0.03)",
            alignItems: "center", gap: 8, transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(153,69,255,0.04)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isTop ? `${rankColor}15` : "transparent",
              border: isTop ? `1px solid ${rankColor}40` : "1px solid rgba(255,255,255,0.05)",
            }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 800, color: isTop ? rankColor : "rgba(255,255,255,0.2)" }}>{i + 1}</span>
            </div>

            <a href={`https://solscan.io/account/${h.address}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontFamily: "monospace", fontSize: 11,
                color: isTop ? rankColor : "rgba(255,255,255,0.45)",
                textDecoration: "none",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontWeight: isTop ? 700 : 400, transition: "opacity 0.15s",
              }}
              onMouseEnter={e => ((e.target as HTMLElement).style.opacity = "0.65")}
              onMouseLeave={e => ((e.target as HTMLElement).style.opacity = "1")}
            >
              {h.address.slice(0, 6)}Â·Â·Â·{h.address.slice(-4)} â†—
            </a>

            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
              {fmt(h.amount, 0)}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${Math.min(h.pct, 100)}%`,
                  background: isTop ? `linear-gradient(90deg, ${rankColor}70, ${rankColor})` : "linear-gradient(90deg, rgba(153,69,255,0.3), rgba(153,69,255,0.6))",
                  borderRadius: 2,
                  boxShadow: isTop ? `0 0 6px ${rankColor}50` : "none",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700,
                color: isTop ? rankColor : "rgba(255,255,255,0.28)",
                minWidth: 38, textAlign: "right",
              }}>
                {h.pct.toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ COPY ADDRESS BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 13px", borderRadius: 8, cursor: "pointer",
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.06em",
        border: copied ? "1px solid rgba(20,241,149,0.45)" : "1px solid rgba(153,69,255,0.22)",
        background: copied ? "rgba(20,241,149,0.07)" : "rgba(153,69,255,0.06)",
        color: copied ? "#14F195" : "rgba(153,69,255,0.65)",
        boxShadow: copied ? "0 0 14px rgba(20,241,149,0.2)" : "none",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        animation: copied ? "copyPop 0.25s" : undefined,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        if (!copied) {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "rgba(153,69,255,0.4)";
          b.style.color = "#9945FF";
          b.style.background = "rgba(153,69,255,0.1)";
        }
      }}
      onMouseLeave={e => {
        if (!copied) {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "rgba(153,69,255,0.22)";
          b.style.color = "rgba(153,69,255,0.65)";
          b.style.background = "rgba(153,69,255,0.06)";
        }
      }}
    >
      {copied ? (
        <>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14F195" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          COPIED
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          COPY
        </>
      )}
    </button>
  );
}

// â”€â”€â”€ TOKEN DETAIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TokenDetail({ token, onBack }: { token: DexToken; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"Trades" | "Holders">("Trades");
  const [newTradeIds, setNewTradeIds] = useState<Set<number>>(new Set());
  const prevTradeIdsRef = useRef<Set<number>>(new Set());

  const { isBuy, amount, selectedGenesisAccount, setIsBuy, setAmount, resetTrade } = useDexStore();
  const genesisAccount = selectedGenesisAccount ?? token.genesisAccount ?? token.mint;
  const { data: curveInfo, isLoading: isLoadingCurve } = useBondingCurveInfo(genesisAccount);
  const { swap, isSwapping, error: swapError } = useSwap();
  const { trades, isLoading: isLoadingTrades } = useTrades(token.mint);

  useEffect(() => {
    const currentIds = new Set(trades.map(t => t.id));
    const newIds = new Set<number>();
    currentIds.forEach(id => { if (!prevTradeIdsRef.current.has(id)) newIds.add(id); });
    if (newIds.size > 0 && prevTradeIdsRef.current.size > 0) {
      setNewTradeIds(newIds);
      setTimeout(() => setNewTradeIds(new Set()), 3000);
    }
    prevTradeIdsRef.current = currentIds;
  }, [trades]);

  const handleSwap = async () => {
    if (!amount) return;
    const ok = await swap({ genesisAccount, mint: token.mint, amount, isBuy });
    if (ok) resetTrade();
  };

  const fillPercent   = curveInfo?.lifecycle?.fillPercent ?? 0;
  const volumeSol     = trades.reduce((s, t) => s + t.amount_sol, 0);

  return (
    <div
      className="detail-layout"
      style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", background: "#080612" }}
    >
      {/* LEFT: Chart + Tabs */}
      <div className="detail-left" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* TOP BAR */}
        <div
          className="top-bar"
          style={{
            padding: "0 18px",
            borderBottom: "1px solid rgba(153,69,255,0.1)",
            display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
            height: 58,
            background: "rgba(8,6,18,0.97)", backdropFilter: "blur(24px)",
          }}
        >
          {/* Back */}
          <button onClick={onBack} style={{
            background: "rgba(153,69,255,0.07)",
            border: "1px solid rgba(153,69,255,0.18)",
            borderRadius: 10, padding: "7px 14px",
            color: "rgba(153,69,255,0.65)",
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
            cursor: "pointer", flexShrink: 0, letterSpacing: "0.06em",
            transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 6,
          }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "rgba(153,69,255,0.4)";
              b.style.color = "#9945FF";
              b.style.background = "rgba(153,69,255,0.1)";
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "rgba(153,69,255,0.18)";
              b.style.color = "rgba(153,69,255,0.65)";
              b.style.background = "rgba(153,69,255,0.07)";
            }}
          >
            â† <span className="back-btn-label">BACK</span>
          </button>

          <div style={{ width: 1, height: 26, background: "rgba(153,69,255,0.1)", flexShrink: 0 }} />

          <TokenAvatar token={token} size={30} />

          <div style={{ minWidth: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                color: "#fff", fontWeight: 700, fontSize: 14,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{token.name}</span>
              <span style={{
                color: "#14F195", fontSize: 9, fontWeight: 700,
                background: "rgba(20,241,149,0.07)", border: "1px solid rgba(20,241,149,0.18)",
                padding: "2px 7px", borderRadius: 5, flexShrink: 0, letterSpacing: "0.08em",
              }}>${token.symbol}</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.17)", fontSize: 9, marginTop: 1, fontFamily: "monospace" }}>
              {token.mint.slice(0, 8)}Â·Â·Â·{token.mint.slice(-6)}
            </div>
          </div>

          <div style={{ width: 1, height: 26, background: "rgba(153,69,255,0.08)", flexShrink: 0 }} />

          {/* Stats â€” only volume + trades count, no price/liquidity */}
          <div className="top-bar-stats" style={{ display: "flex", gap: 0, flex: 1 }}>
            {[
              { label: "VOLUME",  value: volumeSol > 0 ? `${volumeSol.toFixed(2)} SOL` : "â€”", color: "rgba(255,255,255,0.75)" },
              { label: "TRADES",  value: String(trades.length),                               color: "rgba(255,255,255,0.75)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-chip">
                <span style={{ color: "rgba(153,69,255,0.35)", fontSize: 8, letterSpacing: "0.12em", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</span>
                <span style={{ color, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* External links */}
          <div style={{ display: "flex", gap: 5, marginLeft: "auto", flexShrink: 0, alignItems: "center" }}>
            <CopyAddressButton address={token.mint} />
            {[
              { label: "Solscan", href: `https://solscan.io/token/${token.mint}` },
              { label: "Birdeye", href: `https://birdeye.so/token/${token.mint}?chain=solana` },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                padding: "6px 11px", borderRadius: 8,
                border: "1px solid rgba(153,69,255,0.14)",
                color: "rgba(153,69,255,0.45)", fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 9, textDecoration: "none", transition: "all 0.15s",
                letterSpacing: "0.04em", fontWeight: 600,
              }}
                onMouseEnter={e => {
                  const a = e.currentTarget as HTMLAnchorElement;
                  a.style.borderColor = "rgba(153,69,255,0.38)";
                  a.style.color = "#9945FF";
                  a.style.background = "rgba(153,69,255,0.07)";
                }}
                onMouseLeave={e => {
                  const a = e.currentTarget as HTMLAnchorElement;
                  a.style.borderColor = "rgba(153,69,255,0.14)";
                  a.style.color = "rgba(153,69,255,0.45)";
                  a.style.background = "transparent";
                }}
              >{label} â†—</a>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="chart-area" style={{ flex: 1, overflow: "hidden", minHeight: 0, background: "#07060f", position: "relative" }}>
          <TradeChart mint={token.mint} trades={trades} />
        </div>

        {/* TABS */}
        <div className="tabs-area" style={{ flexShrink: 0, borderTop: "1px solid rgba(153,69,255,0.08)", background: "rgba(8,6,18,0.99)" }}>
          <div style={{
            display: "flex", alignItems: "center",
            borderBottom: "1px solid rgba(153,69,255,0.07)",
            padding: "0 4px",
          }}>
            {(["Trades", "Holders"] as const).map(tab => (
              <button
                key={tab}
                className="tab-btn"
                onClick={() => setActiveTab(tab)}
                style={{
                  color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.2)",
                  borderBottom: activeTab === tab ? "2px solid #9945FF" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.toUpperCase()}
                {tab === "Trades" && trades.length > 0 && (
                  <span style={{
                    background: activeTab === "Trades" ? "rgba(153,69,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: activeTab === "Trades" ? "#9945FF" : "rgba(255,255,255,0.2)",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 800,
                    padding: "1px 6px", borderRadius: 4,
                    border: activeTab === "Trades" ? "1px solid rgba(153,69,255,0.22)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}>{trades.length}</span>
                )}
              </button>
            ))}

            {/* Live dot */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 18, gap: 5 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", background: "#14F195",
                boxShadow: "0 0 8px #14F195", animation: "pulse 1.5s infinite",
              }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, color: "rgba(20,241,149,0.5)", letterSpacing: "0.1em", fontWeight: 700 }}>LIVE</span>
            </div>
          </div>

          <div className="tabs-scroll dex-scroll" style={{ height: 256, overflowY: "auto" }}>
            {activeTab === "Trades" && (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "52px 1fr 1fr 42px 1fr 88px",
                  padding: "8px 18px",
                  borderBottom: "1px solid rgba(153,69,255,0.05)", gap: 8,
                }}>
                  {[
                    { label: "TYPE", cls: "" },
                    { label: "SOL", cls: "" },
                    { label: "TOKENS", cls: "" },
                    { label: "AGE", cls: "" },
                    { label: "MCAP", cls: "trade-head-mcap" },
                    { label: "MAKER", cls: "trade-head-maker" },
                  ].map(({ label, cls }) => (
                    <span key={label} className={cls} style={{
                      color: "rgba(153,69,255,0.28)", fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 9, letterSpacing: "0.12em", fontWeight: 700,
                    }}>{label}</span>
                  ))}
                </div>

                {isLoadingTrades ? (
                  <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                ) : trades.length === 0 ? (
                  <div style={{ padding: "32px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 10, opacity: 0.12, color: "#9945FF" }}>â—ˆ</div>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      No trades yet
                    </div>
                    <div style={{ color: "rgba(153,69,255,0.3)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>
                      Be the first to buy this token
                    </div>
                  </div>
                ) : (
                  trades.map(trade => (
                    <TradeRow key={trade.id} trade={trade} isNew={newTradeIds.has(trade.id)} />
                  ))
                )}
              </>
            )}
            {activeTab === "Holders" && <HoldersTab mint={token.mint} />}
          </div>
        </div>
      </div>

      {/* RIGHT: Trade Panel */}
      <div
        className="detail-right dex-scroll"
        style={{
          width: 304, flexShrink: 0,
          borderLeft: "1px solid rgba(153,69,255,0.08)",
          overflowY: "auto", padding: 14,
          background: "rgba(8,6,18,0.99)",
        }}
      >
        <TradePanel
          token={token}
          isBuy={isBuy}
          amount={amount}
          isSwapping={isSwapping}
          swapError={swapError}
          curveInfo={curveInfo ?? null}
          isLoadingCurve={isLoadingCurve}
          onToggleBuy={setIsBuy}
          onAmountChange={setAmount}
          onSwap={handleSwap}
        />
      </div>
    </div>
  );
}

// â”€â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DexPageContent() {
  const searchParams  = useSearchParams();
  const mintFromUrl   = searchParams.get("mint");
  const [searchInput, setSearchInput] = useState("");
  const [newMints, setNewMints]       = useState<Set<string>>(new Set());
  const prevMintsRef                  = useRef<Set<string>>(new Set());

  const { search, selectedMint, setSearch, selectToken, resetTrade } = useDexStore();
  const { tokens, isLoading, isFetching, refresh }                   = useDexTokens();

  const filteredTokens = useMemo(() => {
    const base = filterTokens(tokens, search);
    return [...base].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 50);
  }, [tokens, search]);

  useEffect(() => {
    const currentMints = new Set(filteredTokens.map(t => t.mint));
    const added = new Set<string>();
    currentMints.forEach(m => { if (!prevMintsRef.current.has(m) && prevMintsRef.current.size > 0) added.add(m); });
    if (added.size > 0) {
      setNewMints(prev => new Set([...prev, ...added]));
      setTimeout(() => setNewMints(prev => {
        const n = new Set(prev);
        added.forEach(m => n.delete(m));
        return n;
      }), 7000);
    }
    prevMintsRef.current = currentMints;
  }, [filteredTokens]);

  const selectedToken = useMemo(
    () => tokens.find(t => t.mint === selectedMint) ?? null,
    [tokens, selectedMint]
  );

  useEffect(() => {
    const match = tokens.find(t => t.mint === mintFromUrl);
    if (match) selectToken(match.mint, match.genesisAccount ?? null);
  }, [mintFromUrl, tokens, selectToken]);

  return (
    <div style={{ minHeight: "100vh", background: "#080612", color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>
      <Background />

      <div style={{ position: "relative", zIndex: 1 }}>
        <DexHeader onRefresh={() => refresh()} isRefreshing={isFetching} />

        {selectedToken ? (
          <TokenDetail token={selectedToken} onBack={() => { selectToken("", null); resetTrade(); }} />
        ) : (
          <div className="page-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 80px" }}>

            {/* Page header */}
            <div style={{ marginBottom: 32, animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)" }}>
              <p style={{
                color: "#9945FF", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 10px",
              }}>
                BluPrint DEX
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <img src="/favicon.ico" alt="BluPrint" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
                <h1 style={{
                  margin: 0, fontSize: 26, fontWeight: 800, color: "#fff",
                  fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em",
                }}>
                  Token Explorer
                </h1>
              </div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
                Browse, trade and track every token launched on BluPrint â€” live.
              </p>
            </div>

            {/* Search + controls */}
            <div className="search-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.06s both" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 460 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(153,69,255,0.4)" strokeWidth={2.5} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="dex-input"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                  placeholder="Search by name, symbol or address..."
                  style={{ height: 46 }}
                />
              </div>

              {/* Live counter */}
              <div className="glass" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 46, flexShrink: 0 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#14F195", boxShadow: "0 0 8px #14F195",
                  animation: "pulse 1.5s infinite",
                }} />
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>
                  {filteredTokens.length}{" "}
                  <span style={{ color: "rgba(153,69,255,0.5)" }}>tokens</span>
                </span>
              </div>

              {/* Refresh */}
              <button
                onClick={() => refresh()}
                disabled={isFetching}
                style={{
                  height: 46, padding: "0 18px",
                  border: "1px solid rgba(153,69,255,0.2)",
                  borderRadius: 12, cursor: isFetching ? "wait" : "pointer",
                  color: isFetching ? "rgba(153,69,255,0.3)" : "rgba(153,69,255,0.65)",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.06em", background: "rgba(153,69,255,0.06)",
                  transition: "all 0.2s", flexShrink: 0, whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  if (!isFetching) {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "rgba(153,69,255,0.42)";
                    b.style.color = "#9945FF";
                    b.style.background = "rgba(153,69,255,0.1)";
                  }
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "rgba(153,69,255,0.2)";
                  b.style.color = "rgba(153,69,255,0.65)";
                  b.style.background = "rgba(153,69,255,0.06)";
                }}
              >
                {isFetching ? "â†» ..." : "â†» REFRESH"}
              </button>
            </div>

            {/* Token grid */}
            {isLoading ? (
              <div className="token-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton" style={{
                    borderRadius: 16, overflow: "hidden", animationDelay: `${i * 0.06}s`,
                  }}>
                    <div style={{ paddingBottom: "62%", background: "rgba(153,69,255,0.03)" }} />
                    <div style={{ padding: "12px 14px 16px" }}>
                      <div style={{ height: 13, borderRadius: 4, background: "rgba(153,69,255,0.05)", marginBottom: 8 }} />
                      <div style={{ height: 10, borderRadius: 4, background: "rgba(153,69,255,0.03)", width: "50%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="glass" style={{ padding: "80px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 34, opacity: 0.1, color: "#9945FF", marginBottom: 14 }}>â—ˆ</div>
                <p style={{ color: "rgba(255,255,255,0.22)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, margin: 0 }}>
                  {search ? `No tokens matching "${search}"` : "No tokens yet"}
                </p>
              </div>
            ) : (
              <div className="token-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {filteredTokens.map((token, i) => (
                  <div key={token.mint} style={{ animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 0.04, 0.4)}s both` }}>
                    <TokenCard
                      token={token}
                      isNew={newMints.has(token.mint)}
                      onClick={() => { selectToken(token.mint, token.genesisAccount ?? null); resetTrade(); }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

