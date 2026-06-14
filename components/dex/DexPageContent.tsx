"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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

// ─── TOKEN AVATAR ────────────────────────────────────────────────────────────

function TokenAvatar({ token, size = 48 }: { token: DexToken; size?: number }) {
  const grads = ["#9945FF,#14F195", "#ff2d95,#9945FF", "#14F195,#0ea5e9", "#f59e0b,#ff2d95"];
  const grad = grads[(token.symbol.charCodeAt(0) ?? 0) % grads.length];
  if (token.imageUrl) {
    return (
      <img src={token.imageUrl} alt={token.symbol}
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
    }}>
      {token.symbol.charAt(0)}
    </div>
  );
}

// ─── TOKEN CARD (pump.fun style) ─────────────────────────────────────────────

function TokenCard({ token, isNew, onClick }: { token: DexToken; isNew: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const age = token.createdAt ? Date.now() - token.createdAt : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(153,69,255,0.1)"
          : isNew
          ? "rgba(153,69,255,0.06)"
          : "rgba(255,255,255,0.025)",
        border: isNew
          ? "1px solid rgba(153,69,255,0.5)"
          : hovered
          ? "1px solid rgba(153,69,255,0.3)"
          : "1px solid rgba(255,255,255,0.05)",
        borderRadius: 16,
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? "0 16px 48px rgba(153,69,255,0.2), 0 0 0 1px rgba(153,69,255,0.1)"
          : isNew
          ? "0 0 24px rgba(153,69,255,0.12)"
          : "none",
        animation: isNew ? "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1)" : undefined,
        position: "relative",
      }}
    >
      {/* Token image */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "68%", background: "rgba(153,69,255,0.05)" }}>
        {token.imageUrl ? (
          <img src={token.imageUrl} alt={token.name} style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            filter: hovered ? "brightness(1.1)" : "brightness(1)",
            transition: "filter 0.2s",
          }} loading="lazy" />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(145deg, rgba(153,69,255,0.15), rgba(20,241,149,0.08))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 52, fontWeight: 900, color: "rgba(153,69,255,0.35)",
          }}>
            {token.symbol.charAt(0)}
          </div>
        )}

        {/* Badges */}
        {isNew && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "linear-gradient(135deg, #9945FF, #14F195)",
            borderRadius: 6, padding: "3px 8px",
            fontSize: 9, fontFamily: "monospace", fontWeight: 800, color: "#fff",
            letterSpacing: "0.12em", animation: "badgePulse 1.8s ease-in-out infinite",
            boxShadow: "0 0 12px rgba(153,69,255,0.6)",
          }}>✦ NEW</div>
        )}
        {age !== null && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
            borderRadius: 6, padding: "3px 7px",
            fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.06em",
          }}>{fmtAge(age)}</div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(7,7,15,0.9) 0%, transparent 60%)",
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.2s",
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px" }}>
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
            color: "#14F195", fontFamily: "monospace", fontSize: 10, fontWeight: 700,
            background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.2)",
            padding: "2px 7px", borderRadius: 5, flexShrink: 0, letterSpacing: "0.04em",
          }}>${token.symbol}</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.18)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.03em" }}>
          {token.mint.slice(0, 6)}···{token.mint.slice(-4)}
        </div>
      </div>
    </div>
  );
}

// ─── LIVE TRADE ROW ───────────────────────────────────────────────────────────

function TradeRow({ trade, isNew }: { trade: Trade; isNew: boolean }) {
  const age = Date.now() - new Date(trade.created_at).getTime();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "52px 80px 80px 50px 90px",
        padding: "9px 16px",
        borderBottom: "1px solid rgba(153,69,255,0.04)",
        alignItems: "center",
        background: isNew
          ? trade.is_buy ? "rgba(20,241,149,0.05)" : "rgba(255,45,149,0.04)"
          : "transparent",
        transition: "background 1.2s ease",
        animation: isNew ? "tradeSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)" : undefined,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(153,69,255,0.05)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{
        fontFamily: "monospace", fontSize: 11, fontWeight: 800,
        color: trade.is_buy ? "#14F195" : "#ff2d95",
        textShadow: trade.is_buy ? "0 0 10px rgba(20,241,149,0.4)" : "0 0 10px rgba(255,45,149,0.4)",
        letterSpacing: "0.04em",
      }}>
        {trade.is_buy ? "▲ BUY" : "▼ SELL"}
      </span>

      <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
        {trade.amount_sol.toFixed(4)} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>SOL</span>
      </span>

      <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
        {fmt(trade.amount_token, 0)}
      </span>

      <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
        {fmtAge(age)}
      </span>

      <a
        href={trade.tx_signature ? `https://solscan.io/tx/${trade.tx_signature}` : "#"}
        target="_blank" rel="noopener noreferrer"
        style={{
          fontFamily: "monospace", fontSize: 10,
          color: "rgba(153,69,255,0.6)",
          textDecoration: "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => ((e.target as HTMLElement).style.color = "#9945FF")}
        onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(153,69,255,0.6)")}
      >
        {trade.wallet.slice(0, 4)}···{trade.wallet.slice(-4)}↗
      </a>
    </div>
  );
}

// ─── HOLDERS TAB ──────────────────────────────────────────────────────────────

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
      <div style={{ padding: "24px 16px" }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            height: 36, borderRadius: 8, marginBottom: 8,
            background: `rgba(153,69,255,${0.03 + i * 0.01})`,
            animation: `shimmer 1.5s ${i * 0.1}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>◈</div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 11 }}>
          No holder data available yet
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px 60px", padding: "8px 16px", borderBottom: "1px solid rgba(153,69,255,0.06)" }}>
        {["#", "WALLET", "TOKENS", "SHARE"].map(h => (
          <span key={h} style={{ color: "rgba(153,69,255,0.35)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em" }}>{h}</span>
        ))}
      </div>
      {holders.map((h, i) => (
        <div key={h.address} style={{
          display: "grid", gridTemplateColumns: "28px 1fr 90px 60px",
          padding: "8px 16px", borderBottom: "1px solid rgba(153,69,255,0.03)",
          alignItems: "center",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(153,69,255,0.04)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ color: "rgba(153,69,255,0.4)", fontFamily: "monospace", fontSize: 10 }}>{i + 1}</span>
          <a href={`https://solscan.io/account/${h.address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(153,69,255,0.7)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {h.address.slice(0, 4)}···{h.address.slice(-4)}
          </a>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
            {fmt(h.amount, 0)}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(153,69,255,0.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${h.pct}%`, background: i === 0 ? "#14F195" : "rgba(153,69,255,0.7)", borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", minWidth: 32, textAlign: "right" }}>
              {h.pct.toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
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

  // Detect new trades for animation
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

  const fillPercent = curveInfo?.lifecycle?.fillPercent ?? 0;
  const latestPrice = trades.length > 0 ? trades[0].price : 0;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", background: "#07070f" }}>

      {/* LEFT: Chart + Tabs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          padding: "10px 16px", borderBottom: "1px solid rgba(153,69,255,0.1)",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
        }}>
          <button onClick={onBack} style={{
            background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.18)",
            borderRadius: 8, padding: "6px 12px", color: "rgba(153,69,255,0.7)",
            fontFamily: "monospace", fontSize: 11, cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(153,69,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "#9945FF";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(153,69,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(153,69,255,0.7)";
            }}
          >← Back</button>

          <TokenAvatar token={token} size={34} />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{token.name}</span>
              <span style={{ color: "rgba(153,69,255,0.9)", fontFamily: "monospace", fontSize: 10, background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.2)", padding: "1px 7px", borderRadius: 5, flexShrink: 0 }}>${token.symbol}</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9 }}>{token.mint.slice(0, 8)}···{token.mint.slice(-6)}</span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, marginLeft: 8 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.08em", marginBottom: 1 }}>PRICE</div>
              <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
                {latestPrice > 0 ? fmtPrice(latestPrice) : "—"}
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginLeft: 3 }}>SOL</span>
              </div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.08em", marginBottom: 1 }}>CURVE</div>
              <div style={{
                fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                color: fillPercent > 80 ? "#14F195" : fillPercent > 50 ? "#f59e0b" : "rgba(255,255,255,0.7)",
              }}>{fillPercent.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.08em", marginBottom: 1 }}>TRADES</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
                {trades.length}
                {newTradeIds.size > 0 && (
                  <span style={{ color: "#14F195", fontSize: 9, marginLeft: 4, animation: "badgePulse 1s infinite" }}>+{newTradeIds.size}</span>
                )}
              </div>
            </div>
          </div>

          {/* Links */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {[
              { label: "Solscan", href: `https://solscan.io/token/${token.mint}` },
              { label: "Birdeye", href: `https://birdeye.so/token/${token.mint}?chain=solana` },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                padding: "5px 10px", borderRadius: 7,
                border: "1px solid rgba(153,69,255,0.15)",
                color: "rgba(153,69,255,0.55)", fontFamily: "monospace", fontSize: 10,
                textDecoration: "none", transition: "all 0.15s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(153,69,255,0.4)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#9945FF";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(153,69,255,0.15)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(153,69,255,0.55)";
                }}
              >{label} ↗</a>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0, background: "#08080f", position: "relative" }}>
          {/* Bonding curve bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 10,
            background: "rgba(153,69,255,0.1)",
          }}>
            <div style={{
              height: "100%",
              width: `${fillPercent}%`,
              background: fillPercent > 80 ? "#14F195" : "linear-gradient(90deg, #9945FF, #14F195)",
              transition: "width 0.8s ease",
              boxShadow: "0 0 8px rgba(153,69,255,0.6)",
            }} />
          </div>
          <TradeChart mint={token.mint} />
        </div>

        {/* Tabs */}
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(153,69,255,0.08)", background: "rgba(0,0,0,0.35)" }}>
          {/* Tab buttons */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(153,69,255,0.06)" }}>
            {(["Trades", "Holders"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 22px", border: "none", cursor: "pointer",
                fontFamily: "monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
                background: "transparent",
                color: activeTab === tab ? "#14F195" : "rgba(255,255,255,0.25)",
                borderBottom: activeTab === tab ? "2px solid #14F195" : "2px solid transparent",
                transition: "all 0.15s",
                position: "relative",
              }}>
                {tab}
                {tab === "Trades" && trades.length > 0 && (
                  <span style={{
                    marginLeft: 6, background: activeTab === "Trades" ? "#14F195" : "rgba(153,69,255,0.3)",
                    color: activeTab === "Trades" ? "#000" : "rgba(255,255,255,0.6)",
                    fontFamily: "monospace", fontSize: 9, fontWeight: 800,
                    padding: "1px 5px", borderRadius: 4,
                    transition: "all 0.15s",
                  }}>{trades.length}</span>
                )}
              </button>
            ))}
            {/* Live indicator */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 16, gap: 5 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", background: "#14F195",
                boxShadow: "0 0 6px #14F195", animation: "badgePulse 1.5s infinite",
              }} />
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(20,241,149,0.5)", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
          </div>

          {/* Tab content */}
          <div style={{ height: 240, overflowY: "auto" }} className="dex-scroll">
            {activeTab === "Trades" && (
              <>
                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "52px 80px 80px 50px 90px", padding: "7px 16px", borderBottom: "1px solid rgba(153,69,255,0.05)" }}>
                  {["TYPE", "SOL", "TOKENS", "AGE", "MAKER"].map(h => (
                    <span key={h} style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em", fontWeight: 700 }}>{h}</span>
                  ))}
                </div>

                {isLoadingTrades ? (
                  <div style={{ padding: "20px 16px" }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{
                        height: 34, borderRadius: 6, marginBottom: 6,
                        background: `rgba(153,69,255,${0.03 + i * 0.01})`,
                        animation: `shimmer 1.5s ${i * 0.12}s ease-in-out infinite alternate`,
                      }} />
                    ))}
                  </div>
                ) : trades.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 8, opacity: 0.25 }}>📋</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      No trades yet
                    </div>
                    <div style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 10 }}>
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

            {activeTab === "Holders" && (
              <HoldersTab mint={token.mint} />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Trade Panel */}
      <div style={{
        width: 300, flexShrink: 0,
        borderLeft: "1px solid rgba(153,69,255,0.08)",
        overflowY: "auto", padding: 16,
        background: "rgba(0,0,0,0.2)",
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
  const searchParams = useSearchParams();
  const mintFromUrl = searchParams.get("mint");
  const [searchInput, setSearchInput] = useState("");
  const [newMints, setNewMints] = useState<Set<string>>(new Set());
  const prevMintsRef = useRef<Set<string>>(new Set());

  const { search, selectedMint, setSearch, selectToken, resetTrade } = useDexStore();
  const { tokens, isLoading, isFetching, refresh } = useDexTokens();

  const filteredTokens = useMemo(() => {
    const base = filterTokens(tokens, search);
    return [...base].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 50);
  }, [tokens, search]);

  // Detect new tokens
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

  const selectedToken = useMemo(() => tokens.find(t => t.mint === selectedMint) ?? null, [tokens, selectedMint]);

  useEffect(() => {
    const match = tokens.find(t => t.mint === mintFromUrl);
    if (match) selectToken(match.mint, match.genesisAccount ?? null);
  }, [mintFromUrl, tokens, selectToken]);

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", color: "#fff" }}>
      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-8%", left: "-4%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(153,69,255,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,241,149,0.03) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <DexHeader onRefresh={() => refresh()} isRefreshing={isFetching} />

        {selectedToken ? (
          <TokenDetail token={selectedToken} onBack={() => { selectToken("", null); resetTrade(); }} />
        ) : (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>

            {/* Search + stats bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(153,69,255,0.4)", fontSize: 14, pointerEvents: "none" }}>⌕</span>
                <input
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                  placeholder="Search by name or symbol..."
                  style={{
                    width: "100%", height: 44, paddingLeft: 38, paddingRight: 16,
                    background: "rgba(153,69,255,0.06)", border: "1px solid rgba(153,69,255,0.18)",
                    borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "monospace",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(153,69,255,0.4)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(153,69,255,0.18)")}
                />
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "0 14px", height: 44, borderRadius: 12,
                background: "rgba(153,69,255,0.05)", border: "1px solid rgba(153,69,255,0.12)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 8px #14F195", animation: "badgePulse 1.5s infinite" }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 11 }}>
                  {filteredTokens.length} tokens
                </span>
              </div>
            </div>

            {/* Token grid */}
            {isLoading ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: 16,
              }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} style={{
                    borderRadius: 16, overflow: "hidden",
                    border: "1px solid rgba(153,69,255,0.06)",
                    animation: `shimmer 1.5s ${i * 0.08}s ease-in-out infinite alternate`,
                  }}>
                    <div style={{ paddingBottom: "68%", background: "rgba(153,69,255,0.04)" }} />
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ height: 14, borderRadius: 4, background: "rgba(153,69,255,0.06)", marginBottom: 8 }} />
                      <div style={{ height: 10, borderRadius: 4, background: "rgba(153,69,255,0.04)", width: "60%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTokens.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12 }}>
                <div style={{ fontSize: 36, opacity: 0.2 }}>◈</div>
                <span style={{ color: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: 13 }}>
                  {search ? `No tokens matching "${search}"` : "No tokens yet"}
                </span>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: 16,
              }}>
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

      <style>{`
        @keyframes badgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tradeSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          from { opacity: 0.4; }
          to { opacity: 0.7; }
        }
        .dex-scroll::-webkit-scrollbar { width: 3px; }
        .dex-scroll::-webkit-scrollbar-track { background: transparent; }
        .dex-scroll::-webkit-scrollbar-thumb { background: rgba(153,69,255,0.18); border-radius: 2px; }
        input::placeholder { color: rgba(153,69,255,0.28); }
      `}</style>
    </div>
  );
}