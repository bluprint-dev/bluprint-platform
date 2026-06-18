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

// ─── HELPERS ────────────────────────────────────────────────────────────────

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

function fmtPrice(p: number) {
  if (p === 0) return "—";
  if (p < 0.000001) return p.toExponential(2);
  if (p < 0.001) return p.toFixed(8);
  return p.toFixed(6);
}

function fmtMcap(mcapSol: number, solPrice = 145) {
  const usd = mcapSol * solPrice;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

const SOL_PRICE_USD = 145;
const TOTAL_SUPPLY = 1_000_000_000;

// ─── GLOBAL STYLES ──────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap');

  :root {
    --purple: #9945FF;
    --green: #14F195;
    --dark: #0F0817;
    --card: rgba(255,255,255,0.04);
    --border: rgba(153,69,255,0.2);
    --border-green: rgba(20,241,149,0.25);
  }

  .glow-purple { box-shadow: 0 0 20px rgba(153,69,255,0.3), 0 0 40px rgba(153,69,255,0.1); }
  .glow-green  { box-shadow: 0 0 20px rgba(20,241,149,0.4), 0 0 40px rgba(20,241,149,0.15); }
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
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .mesh-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.1;
  }

  .dex-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(153,69,255,0.25);
    border-radius: 12px;
    color: #fff;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    padding: 12px 16px;
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s;
  }
  .dex-input:focus { border-color: rgba(153,69,255,0.5); }
  .dex-input::placeholder { color: rgba(153,69,255,0.3); }

  .skeleton {
    background: rgba(255,255,255,0.06);
    border-radius: 6px;
    animation: dexShimmer 1.5s ease-in-out infinite;
  }

  @keyframes dexShimmer    { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes badgePulse    { 0%,100%{opacity:1}   50%{opacity:0.3} }
  @keyframes cardSlideIn   { from{opacity:0;transform:translateY(-10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes tradeSlideIn  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes currentPulse  { 0%,100%{box-shadow:0 0 10px rgba(153,69,255,0.7)} 50%{box-shadow:0 0 20px rgba(153,69,255,1),0 0 30px rgba(153,69,255,0.4)} }
  @keyframes newBadge      { 0%{opacity:0;transform:scale(0.8)} 100%{opacity:1;transform:scale(1)} }

  .dex-scroll::-webkit-scrollbar       { width: 3px; }
  .dex-scroll::-webkit-scrollbar-track { background: transparent; }
  .dex-scroll::-webkit-scrollbar-thumb { background: rgba(153,69,255,0.15); border-radius: 2px; }
`;

// ─── TOKEN AVATAR ────────────────────────────────────────────────────────────

function TokenAvatar({ token, size = 48 }: { token: DexToken; size?: number }) {
  const grads = ["#9945FF,#14F195", "#ff2d95,#9945FF", "#14F195,#0ea5e9", "#f59e0b,#ff2d95"];
  const grad = grads[(token.symbol.charCodeAt(0) ?? 0) % grads.length];
  if (token.imageUrl) {
    return (
      <img
        src={token.imageUrl}
        alt={token.symbol}
        style={{ width: size, height: size, borderRadius: size * 0.25, objectFit: "cover", flexShrink: 0 }}
        loading="lazy"
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25, flexShrink: 0,
      background: `linear-gradient(135deg, ${grad})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 900, color: "#fff",
      textShadow: "0 2px 8px rgba(0,0,0,0.4)",
      fontFamily: "'Orbitron', monospace",
    }}>
      {token.symbol.charAt(0)}
    </div>
  );
}

// ─── TOKEN CARD ──────────────────────────────────────────────────────────────

function TokenCard({ token, isNew, onClick }: { token: DexToken; isNew: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const age = token.createdAt ? Date.now() - token.createdAt : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={hovered ? "glass-card glow-purple" : isNew ? "glass-card" : "glass-card"}
      style={{
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        border: isNew
          ? "1px solid rgba(153,69,255,0.5)"
          : hovered
          ? "1px solid rgba(153,69,255,0.35)"
          : "1px solid rgba(153,69,255,0.2)",
        animation: isNew ? "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1)" : undefined,
        position: "relative",
      }}
    >
      {/* Image area */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "65%", background: "rgba(153,69,255,0.04)" }}>
        {token.imageUrl ? (
          <img
            src={token.imageUrl}
            alt={token.name}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              filter: hovered ? "brightness(1.08)" : "brightness(1)",
              transition: "filter 0.2s",
            }}
            loading="lazy"
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(145deg, rgba(153,69,255,0.12), rgba(20,241,149,0.06))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Orbitron', monospace",
            fontSize: 48, fontWeight: 900, color: "rgba(153,69,255,0.3)",
          }}>
            {token.symbol.charAt(0)}
          </div>
        )}

        {/* NEW badge */}
        {isNew && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "linear-gradient(135deg, #9945FF, #14F195)",
            borderRadius: 6, padding: "3px 9px",
            fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            color: "#0F0817", letterSpacing: "0.1em",
            animation: "newBadge 0.4s cubic-bezier(0.16,1,0.3,1), badgePulse 1.8s ease-in-out 0.4s infinite",
            boxShadow: "0 0 14px rgba(153,69,255,0.5)",
          }}>✦ NEW</div>
        )}

        {/* Age badge */}
        {age !== null && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(15,8,23,0.75)", backdropFilter: "blur(8px)",
            borderRadius: 6, padding: "3px 8px",
            fontSize: 9, fontFamily: "'Space Grotesk', sans-serif",
            color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>{fmtAge(age)}</div>
        )}

        {/* Bottom fade */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(15,8,23,0.88) 0%, transparent 55%)",
          opacity: hovered ? 1 : 0.75, transition: "opacity 0.2s",
        }} />
      </div>

      {/* Info row */}
      <div style={{ padding: "14px 16px 16px", fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{
            color: "#fff", fontWeight: 700, fontSize: 14,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
            textShadow: hovered ? "0 0 20px rgba(153,69,255,0.5)" : "none",
            transition: "text-shadow 0.2s",
          }}>
            {token.name}
          </span>
          <span style={{
            color: "#14F195", fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 10, fontWeight: 700,
            background: "rgba(20,241,149,0.08)", border: "1px solid rgba(20,241,149,0.2)",
            padding: "2px 8px", borderRadius: 6, flexShrink: 0, letterSpacing: "0.05em",
          }}>${token.symbol}</span>
        </div>
        <div style={{
          color: "rgba(255,255,255,0.2)", fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10, letterSpacing: "0.04em",
        }}>
          {token.mint.slice(0, 6)}···{token.mint.slice(-4)}
        </div>
      </div>
    </div>
  );
}

// ─── LIVE TRADE ROW ──────────────────────────────────────────────────────────

function TradeRow({ trade, isNew }: { trade: Trade; isNew: boolean }) {
  const age = Date.now() - new Date(trade.created_at).getTime();
  const mcapSol = trade.price * TOTAL_SUPPLY;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "52px 1fr 1fr 48px 1fr 84px",
        padding: "10px 20px",
        borderBottom: "1px solid rgba(153,69,255,0.04)",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Space Grotesk', sans-serif",
        background: isNew
          ? trade.is_buy ? "rgba(20,241,149,0.04)" : "rgba(255,45,149,0.03)"
          : "transparent",
        transition: "background 1.5s ease",
        animation: isNew ? "tradeSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)" : undefined,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(153,69,255,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "4px 0", borderRadius: 6,
        background: trade.is_buy ? "rgba(20,241,149,0.1)" : "rgba(255,45,149,0.1)",
        border: `1px solid ${trade.is_buy ? "rgba(20,241,149,0.22)" : "rgba(255,45,149,0.22)"}`,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700,
          color: trade.is_buy ? "#14F195" : "#ff2d95",
          letterSpacing: "0.08em",
        }}>
          {trade.is_buy ? "BUY" : "SELL"}
        </span>
      </div>

      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
        {trade.amount_sol.toFixed(4)}
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginLeft: 3 }}>SOL</span>
      </span>

      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
        {fmt(trade.amount_token, 0)}
      </span>

      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "right" }}>
        {fmtAge(age)}
      </span>

      <span style={{ fontSize: 10, color: "rgba(153,69,255,0.7)", fontWeight: 600 }}>
        {mcapSol > 0 ? fmtMcap(mcapSol) : "—"}
      </span>

      <a
        href={trade.tx_signature ? `https://solscan.io/tx/${trade.tx_signature}` : "#"}
        target="_blank" rel="noopener noreferrer"
        style={{
          fontSize: 10, color: "rgba(153,69,255,0.45)",
          textDecoration: "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => ((e.target as HTMLElement).style.color = "#9945FF")}
        onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(153,69,255,0.45)")}
      >
        {trade.wallet.slice(0, 4)}···{trade.wallet.slice(-4)} ↗
      </a>
    </div>
  );
}

// ─── HOLDERS TAB ─────────────────────────────────────────────────────────────

function HoldersTab({ mint }: { mint: string }) {
  const [holders, setHolders] = useState<{ address: string; amount: number; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_KEY ?? ""}`, {
      method: "POST",
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
      <div style={{ padding: "16px 20px" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{
            height: 44, borderRadius: 10, marginBottom: 6,
            animationDelay: `${i * 0.08}s`,
          }} />
        ))}
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.15, color: "#9945FF" }}>◈</div>
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
        display: "grid", gridTemplateColumns: "32px 1fr 100px 140px",
        padding: "8px 20px 10px",
        borderBottom: "1px solid rgba(153,69,255,0.06)",
        gap: 8,
      }}>
        {["#", "WALLET", "TOKENS", "SHARE"].map(h => (
          <span key={h} style={{
            color: "rgba(153,69,255,0.35)", fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 9, letterSpacing: "0.12em", fontWeight: 700,
          }}>{h}</span>
        ))}
      </div>

      {holders.map((h, i) => {
        const rankColor = i < 3 ? top3Colors[i] : "rgba(255,255,255,0.15)";
        const isTop = i < 3;
        return (
          <div key={h.address} style={{
            display: "grid", gridTemplateColumns: "32px 1fr 100px 140px",
            padding: "10px 20px",
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
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 800,
                color: isTop ? rankColor : "rgba(255,255,255,0.2)",
              }}>{i + 1}</span>
            </div>

            <a href={`https://solscan.io/account/${h.address}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
                color: isTop ? rankColor : "rgba(255,255,255,0.5)",
                textDecoration: "none",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontWeight: isTop ? 700 : 400, transition: "opacity 0.15s",
              }}
              onMouseEnter={e => ((e.target as HTMLElement).style.opacity = "0.7")}
              onMouseLeave={e => ((e.target as HTMLElement).style.opacity = "1")}
            >
              {h.address.slice(0, 6)}···{h.address.slice(-4)} ↗
            </a>

            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
              {fmt(h.amount, 0)}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                flex: 1, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.04)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${Math.min(h.pct, 100)}%`,
                  background: isTop
                    ? `linear-gradient(90deg, ${rankColor}88, ${rankColor})`
                    : "linear-gradient(90deg, rgba(153,69,255,0.3), rgba(153,69,255,0.6))",
                  borderRadius: 2,
                  boxShadow: isTop ? `0 0 6px ${rankColor}60` : "none",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700,
                color: isTop ? rankColor : "rgba(255,255,255,0.3)",
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

// ─── TOKEN DETAIL ─────────────────────────────────────────────────────────────

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
  const latestPrice   = trades.length > 0 ? trades[0].price : 0;
  const mcapSol       = latestPrice * TOTAL_SUPPLY;
  const quoteReserves = curveInfo?.reserves?.quoteReserves ?? "0";
  const volumeSol     = trades.reduce((s, t) => s + t.amount_sol, 0);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", background: "#0F0817" }}>

      {/* LEFT: Chart + Tabs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* TOP BAR */}
        <div style={{
          padding: "0 20px",
          borderBottom: "1px solid rgba(153,69,255,0.1)",
          display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
          height: 60,
          background: "rgba(15,8,23,0.97)", backdropFilter: "blur(20px)",
        }}>
          {/* Back */}
          <button onClick={onBack} style={{
            background: "rgba(153,69,255,0.06)",
            border: "1px solid rgba(153,69,255,0.2)",
            borderRadius: 10, padding: "6px 14px",
            color: "rgba(153,69,255,0.7)",
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
            cursor: "pointer", flexShrink: 0, letterSpacing: "0.06em",
            transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 6,
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(153,69,255,0.45)";
              (e.currentTarget as HTMLButtonElement).style.color = "#9945FF";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(153,69,255,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(153,69,255,0.2)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(153,69,255,0.7)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(153,69,255,0.06)";
            }}
          >← BACK</button>

          <div style={{ width: 1, height: 28, background: "rgba(153,69,255,0.12)" }} />

          <TokenAvatar token={token} size={32} />

          <div style={{ minWidth: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{
                color: "#fff", fontWeight: 700, fontSize: 14,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{token.name}</span>
              <span style={{
                color: "#14F195", fontSize: 9, fontWeight: 700,
                background: "rgba(20,241,149,0.08)", border: "1px solid rgba(20,241,149,0.18)",
                padding: "2px 7px", borderRadius: 5, flexShrink: 0, letterSpacing: "0.08em",
              }}>${token.symbol}</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, marginTop: 1, letterSpacing: "0.03em" }}>
              {token.mint.slice(0, 8)}···{token.mint.slice(-6)}
            </div>
          </div>

          <div style={{ width: 1, height: 28, background: "rgba(153,69,255,0.08)", marginLeft: 4 }} />

          {/* Stats */}
          <div style={{ display: "flex", gap: 0, flex: 1 }}>
            {[
              { label: "PRICE",     value: latestPrice > 0 ? fmtPrice(latestPrice) : "—",  sub: undefined,  color: "#fff" },
              { label: "MCAP",      value: mcapSol > 0 ? fmtMcap(mcapSol) : "—",           sub: undefined,  color: "#14F195" },
              { label: "LIQUIDITY", value: Number(quoteReserves) > 0 ? `${(Number(quoteReserves) / 1e9).toFixed(2)}` : "—", sub: "SOL", color: "#9945FF" },
              { label: "VOLUME",    value: volumeSol > 0 ? `${volumeSol.toFixed(2)}` : "—", sub: "SOL",      color: "rgba(255,255,255,0.7)" },
              { label: "TRADES",    value: String(trades.length),                            sub: newTradeIds.size > 0 ? `+${newTradeIds.size} new` : undefined, color: "rgba(255,255,255,0.7)" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ padding: "0 18px", borderRight: "1px solid rgba(153,69,255,0.06)" }}>
                <div style={{
                  color: "rgba(153,69,255,0.4)", fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 8, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 3,
                }}>{label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ color, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700 }}>{value}</span>
                  {sub && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 8 }}>{sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexShrink: 0 }}>
            {[
              { label: "Solscan", href: `https://solscan.io/token/${token.mint}` },
              { label: "Birdeye", href: `https://birdeye.so/token/${token.mint}?chain=solana` },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                padding: "5px 10px", borderRadius: 7,
                border: "1px solid rgba(153,69,255,0.15)",
                color: "rgba(153,69,255,0.5)", fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 9, textDecoration: "none", transition: "all 0.15s",
                letterSpacing: "0.04em", fontWeight: 600,
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(153,69,255,0.4)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#9945FF";
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(153,69,255,0.07)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(153,69,255,0.15)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(153,69,255,0.5)";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >{label} ↗</a>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0, background: "#08080f", position: "relative" }}>
          <TradeChart mint={token.mint} trades={trades} />
        </div>

        {/* TABS */}
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(153,69,255,0.08)", background: "rgba(15,8,23,0.99)" }}>
          <div style={{
            display: "flex", alignItems: "center",
            borderBottom: "1px solid rgba(153,69,255,0.07)",
            padding: "0 4px",
          }}>
            {(["Trades", "Holders"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "12px 20px",
                border: "none", cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 800,
                letterSpacing: "0.1em",
                background: "transparent",
                color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.2)",
                borderBottom: activeTab === tab ? "2px solid #9945FF" : "2px solid transparent",
                marginBottom: -1, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                {tab.toUpperCase()}
                {tab === "Trades" && trades.length > 0 && (
                  <span style={{
                    background: activeTab === "Trades" ? "rgba(153,69,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: activeTab === "Trades" ? "#9945FF" : "rgba(255,255,255,0.2)",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 800,
                    padding: "1px 6px", borderRadius: 4,
                    border: `1px solid ${activeTab === "Trades" ? "rgba(153,69,255,0.25)" : "transparent"}`,
                    transition: "all 0.15s",
                  }}>{trades.length}</span>
                )}
              </button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 20, gap: 6 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", background: "#14F195",
                boxShadow: "0 0 8px #14F195", animation: "badgePulse 1.5s infinite",
              }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, color: "rgba(20,241,149,0.5)", letterSpacing: "0.1em", fontWeight: 700 }}>LIVE</span>
            </div>
          </div>

          <div style={{ height: 260, overflowY: "auto" }} className="dex-scroll">
            {activeTab === "Trades" && (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "52px 1fr 1fr 48px 1fr 84px",
                  padding: "8px 20px",
                  borderBottom: "1px solid rgba(153,69,255,0.05)", gap: 8,
                }}>
                  {["TYPE", "SOL", "TOKENS", "AGE", "MCAP", "MAKER"].map(h => (
                    <span key={h} style={{
                      color: "rgba(153,69,255,0.28)", fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 9, letterSpacing: "0.12em", fontWeight: 700,
                    }}>{h}</span>
                  ))}
                </div>

                {isLoadingTrades ? (
                  <div style={{ padding: "16px 20px" }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="skeleton" style={{
                        height: 38, borderRadius: 8, marginBottom: 6,
                        animationDelay: `${i * 0.1}s`,
                      }} />
                    ))}
                  </div>
                ) : trades.length === 0 ? (
                  <div style={{ padding: "36px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 10, opacity: 0.15, color: "#9945FF" }}>◈</div>
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
      <div style={{
        width: 308, flexShrink: 0,
        borderLeft: "1px solid rgba(153,69,255,0.08)",
        overflowY: "auto", padding: 16,
        background: "rgba(15,8,23,0.99)",
      }} className="dex-scroll">
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

// ─── MAIN ────────────────────────────────────────────────────────────────────

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
    const added        = new Set<string>();
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
    <div style={{ minHeight: "100vh", background: "#0F0817", color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Background mesh blobs — identical to referral page */}
      <div className="bg-mesh">
        <div className="mesh-blob" style={{ width: 600, height: 600, background: "#9945FF", top: -100, left: -200 }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, background: "#14F195", bottom: 0, right: -100 }} />
        <div className="mesh-blob" style={{ width: 400, height: 400, background: "#9945FF", top: "50%", left: "40%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <DexHeader onRefresh={() => refresh()} isRefreshing={isFetching} />

        {selectedToken ? (
          <TokenDetail token={selectedToken} onBack={() => { selectToken("", null); resetTrade(); }} />
        ) : (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 20px 80px" }}>

            {/* Page header — referral page style */}
            <div style={{ marginBottom: 36 }}>
              <p style={{
                color: "#9945FF", fontSize: 12, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px",
              }}>
                BluPrint
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                {/* favicon.ico instead of B */}
                <img
                  src="/favicon.ico"
                  alt="BluPrint"
                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain" }}
                />
                <h1 style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "clamp(22px, 4vw, 34px)",
                  fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1,
                }}>
                  DEX <span style={{ color: "#14F195" }} className="glow-text-green">TERMINAL</span>
                </h1>
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, maxWidth: 420 }}>
                Browse, trade, and track every token launched on BluPrint — live.
              </p>
            </div>

            {/* Search + counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 440 }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "rgba(153,69,255,0.4)", fontSize: 14, pointerEvents: "none",
                }}>⌕</span>
                <input
                  className="dex-input"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                  placeholder="Search by name or symbol..."
                  style={{ paddingLeft: 40, height: 46 }}
                  onFocus={e => (e.target.style.borderColor = "rgba(153,69,255,0.5)")}
                  onBlur={e  => (e.target.style.borderColor = "rgba(153,69,255,0.25)")}
                />
              </div>

              {/* Live counter — glass-card style */}
              <div className="glass-card" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0 16px", height: 46, flexShrink: 0,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#14F195", boxShadow: "0 0 8px #14F195",
                  animation: "badgePulse 1.5s infinite",
                }} />
                <span style={{
                  color: "rgba(255,255,255,0.5)", fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12, fontWeight: 600,
                }}>
                  {filteredTokens.length} <span style={{ color: "rgba(153,69,255,0.5)" }}>tokens</span>
                </span>
              </div>

              {/* Refresh — glass-card style */}
              <button
                onClick={() => refresh()}
                disabled={isFetching}
                className="glass-card"
                style={{
                  height: 46, padding: "0 18px",
                  border: "1px solid rgba(153,69,255,0.2)",
                  borderRadius: 16, cursor: isFetching ? "wait" : "pointer",
                  color: isFetching ? "rgba(153,69,255,0.3)" : "rgba(153,69,255,0.7)",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.06em", background: "rgba(255,255,255,0.04)",
                  transition: "all 0.2s", flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!isFetching) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(153,69,255,0.45)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#9945FF";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(153,69,255,0.2)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(153,69,255,0.7)";
                }}
              >
                {isFetching ? "↻ ..." : "↻ REFRESH"}
              </button>
            </div>

            {/* Token grid */}
            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="glass-card skeleton" style={{
                    borderRadius: 16, overflow: "hidden",
                    animationDelay: `${i * 0.07}s`,
                  }}>
                    <div style={{ paddingBottom: "65%", background: "rgba(153,69,255,0.03)" }} />
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ height: 14, borderRadius: 4, background: "rgba(153,69,255,0.06)", marginBottom: 8 }} />
                      <div style={{ height: 10, borderRadius: 4, background: "rgba(153,69,255,0.04)", width: "55%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="glass-card" style={{ padding: "80px 40px", textAlign: "center" }}>
                <div style={{ fontSize: 36, opacity: 0.15, color: "#9945FF", marginBottom: 12 }}>◈</div>
                <p style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, margin: 0 }}>
                  {search ? `No tokens matching "${search}"` : "No tokens yet"}
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {filteredTokens.map(token => (
                  <TokenCard
                    key={token.mint}
                    token={token}
                    isNew={newMints.has(token.mint)}
                    onClick={() => { selectToken(token.mint, token.genesisAccount ?? null); resetTrade(); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}