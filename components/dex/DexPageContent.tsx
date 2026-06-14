"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DexHeader from "@/components/dex/Header";
import TradePanel from "@/components/dex/TradePanel";
import { useDexTokens } from "@/hooks/useDexTokens";
import { useBondingCurveInfo } from "@/hooks/useBondingCurveInfo";
import { useSwap } from "@/hooks/useSwap";
import { useDexStore } from "@/store/dexStore";
import { filterTokens } from "@/lib/dex/normalizeToken";
import { useTrades } from "@/hooks/useTrades";
import type { DexToken } from "@/types/dex";

// ─── AVATAR ──────────────────────────────────────────────────────────────────
function TokenAvatar({ token, size = 48 }: { token: DexToken; size?: number }) {
  const colors = ["#9945FF,#14F195", "#ff2d95,#9945FF", "#14F195,#0fa96a", "#ff6bcb,#ff2d95"];
  const grad = colors[(token.symbol.charCodeAt(0) ?? 0) % colors.length];
  if (token.imageUrl) {
    return <img src={token.imageUrl} alt={token.symbol} style={{ width: size, height: size, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} loading="lazy" />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, flexShrink: 0,
      background: `linear-gradient(135deg, ${grad})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 900, color: "#fff",
    }}>{token.symbol.charAt(0)}</div>
  );
}

// ─── PUMP.FUN STYLE CARD ──────────────────────────────────────────────────────
function TokenCard({ token, isNew, onClick }: { token: DexToken; isNew: boolean; onClick: () => void }) {
  const age = token.createdAt ? Math.floor((Date.now() - token.createdAt) / 60000) : null;
  const ageText = age === null ? "" : age < 60 ? `${age}m` : age < 1440 ? `${Math.floor(age / 60)}h` : `${Math.floor(age / 1440)}d`;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(153,69,255,0.12)" : "rgba(255,255,255,0.03)",
        border: isNew ? "1px solid rgba(153,69,255,0.6)" : hovered ? "1px solid rgba(153,69,255,0.35)" : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 40px rgba(153,69,255,0.18)" : isNew ? "0 0 20px rgba(153,69,255,0.15)" : "none",
        animation: isNew ? "slideIn 0.4s ease" : undefined,
        position: "relative",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "75%", background: "rgba(153,69,255,0.06)" }}>
        {token.imageUrl ? (
          <img src={token.imageUrl} alt={token.name} style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
          }} loading="lazy" />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg, #9945FF22, #14F19522)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48, fontWeight: 900, color: "rgba(153,69,255,0.4)",
          }}>{token.symbol.charAt(0)}</div>
        )}
        {isNew && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "linear-gradient(135deg, #9945FF, #14F195)",
            borderRadius: 6, padding: "3px 8px",
            fontSize: 9, fontFamily: "monospace", fontWeight: 700, color: "#fff",
            letterSpacing: "0.1em", animation: "pulse 1.5s infinite",
          }}>NEW</div>
        )}
        {ageText && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            borderRadius: 6, padding: "3px 8px",
            fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.6)",
          }}>{ageText} ago</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {token.name}
          </span>
          <span style={{
            color: "#14F195", fontFamily: "monospace", fontSize: 10, fontWeight: 700,
            background: "rgba(20,241,149,0.1)", padding: "2px 6px", borderRadius: 4, flexShrink: 0,
          }}>${token.symbol}</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 10 }}>
          {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
        </div>
      </div>
    </div>
  );
}

// ─── TOKEN DETAIL ─────────────────────────────────────────────────────────────
function TokenDetail({ token, onBack }: { token: DexToken; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"Trades" | "Holders">("Trades");

  const { isBuy, amount, selectedGenesisAccount, setIsBuy, setAmount, resetTrade } = useDexStore();
  const genesisAccount = selectedGenesisAccount ?? token.genesisAccount ?? token.mint;
  const { data: curveInfo, isLoading: isLoadingCurve } = useBondingCurveInfo(genesisAccount);
  const { swap, isSwapping, error: swapError } = useSwap();
  const { trades, isLoading: isLoadingTrades } = useTrades(token.mint);

  const handleSwap = async () => {
    if (!amount) return;
    const ok = await swap({ genesisAccount, mint: token.mint, amount, isBuy });
    if (ok) resetTrade();
  };

  const fillPercent = curveInfo?.lifecycle?.fillPercent ?? 0;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", background: "#07070f" }}>

      {/* LEFT: Chart + Tabs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header bar */}
        <div style={{
          padding: "10px 16px", borderBottom: "1px solid rgba(153,69,255,0.1)",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          background: "rgba(0,0,0,0.3)",
        }}>
          <button onClick={onBack} style={{
            background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.2)",
            borderRadius: 8, padding: "6px 12px", color: "rgba(153,69,255,0.8)",
            fontFamily: "monospace", fontSize: 11, cursor: "pointer", flexShrink: 0,
          }}>← Back</button>

          <TokenAvatar token={token} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{token.name}</span>
              <span style={{ color: "rgba(153,69,255,0.8)", fontFamily: "monospace", fontSize: 11, background: "rgba(153,69,255,0.1)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>${token.symbol}</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 10 }}>{token.mint.slice(0, 8)}...{token.mint.slice(-6)}</span>
          </div>

          <div style={{ display: "flex", gap: 16, marginLeft: 12 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9 }}>CURVE</div>
              <div style={{ color: fillPercent > 80 ? "#14F195" : "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{fillPercent.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9 }}>TRADES</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{trades.length}</div>
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <a href={`https://solscan.io/token/${token.mint}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(153,69,255,0.2)", color: "rgba(153,69,255,0.6)", fontFamily: "monospace", fontSize: 10, textDecoration: "none" }}>
              Solscan ↗
            </a>
            <a href={`https://birdeye.so/token/${token.mint}?chain=solana`} target="_blank" rel="noopener noreferrer"
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(153,69,255,0.2)", color: "rgba(153,69,255,0.6)", fontFamily: "monospace", fontSize: 10, textDecoration: "none" }}>
              Birdeye ↗
            </a>
          </div>
        </div>

        {/* Chart — DexScreener embed */}
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0, background: "#0d0d1a" }}>
          <iframe
            src={`https://dexscreener.com/solana/${token.mint}?embed=1&theme=dark&trades=0&info=0`}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="clipboard-write"
          />
        </div>

        {/* Tabs */}
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(153,69,255,0.1)", background: "rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(153,69,255,0.08)" }}>
            {(["Trades", "Holders"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 20px", border: "none", cursor: "pointer",
                fontFamily: "monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                background: "transparent",
                color: activeTab === tab ? "#14F195" : "rgba(255,255,255,0.3)",
                borderBottom: activeTab === tab ? "2px solid #14F195" : "2px solid transparent",
                transition: "all 0.15s",
              }}>{tab}</button>
            ))}
          </div>

          <div style={{ height: 220, overflowY: "auto" }} className="custom-scroll">
            {activeTab === "Trades" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "55px 90px 1fr 60px 110px", padding: "6px 16px", borderBottom: "1px solid rgba(153,69,255,0.06)" }}>
                  {["TYPE", "SOL", "TOKENS", "TIME", "MAKER"].map(h => (
                    <span key={h} style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em" }}>{h}</span>
                  ))}
                </div>
                {isLoadingTrades ? (
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <span style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 10 }}>Loading...</span>
                  </div>
                ) : trades.length === 0 ? (
                  <div style={{ padding: 30, textAlign: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.08)", fontFamily: "monospace", fontSize: 10 }}>AWAITING_TRANSACTIONS...</span>
                  </div>
                ) : trades.map(trade => (
                  <div key={trade.id}
                    style={{ display: "grid", gridTemplateColumns: "55px 90px 1fr 60px 110px", padding: "7px 16px", borderBottom: "1px solid rgba(153,69,255,0.04)", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(153,69,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: trade.is_buy ? "#14F195" : "#ff2d95" }}>{trade.is_buy ? "BUY" : "SELL"}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{trade.amount_sol.toFixed(4)} SOL</span>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                      {trade.amount_token > 1000 ? `${(trade.amount_token / 1000).toFixed(1)}K` : trade.amount_token.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {Math.floor((Date.now() - new Date(trade.created_at).getTime()) / 1000) < 60
                        ? `${Math.floor((Date.now() - new Date(trade.created_at).getTime()) / 1000)}s`
                        : `${Math.floor((Date.now() - new Date(trade.created_at).getTime()) / 60000)}m`}
                    </span>
                    <a href={trade.tx_signature ? `https://solscan.io/tx/${trade.tx_signature}` : "#"}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(153,69,255,0.6)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {trade.wallet.slice(0, 4)}...{trade.wallet.slice(-4)}
                    </a>
                  </div>
                ))}
              </>
            )}
            {activeTab === "Holders" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 24, opacity: 0.2 }}>◈</span>
                <span style={{ color: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: 10 }}>COMING_SOON</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Trade Panel */}
      <div style={{ width: 300, flexShrink: 0, borderLeft: "1px solid rgba(153,69,255,0.1)", overflowY: "auto", padding: 16 }} className="custom-scroll">
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    const currentMints = new Set(filteredTokens.map(t => t.mint));
    const added = new Set<string>();
    currentMints.forEach(m => { if (!prevMintsRef.current.has(m) && prevMintsRef.current.size > 0) added.add(m); });
    if (added.size > 0) {
      setNewMints(prev => new Set([...prev, ...added]));
      setTimeout(() => setNewMints(prev => { const n = new Set(prev); added.forEach(m => n.delete(m)); return n; }), 6000);
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
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(153,69,255,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,241,149,0.03) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <DexHeader onRefresh={() => refresh()} isRefreshing={isFetching} />

        {selectedToken ? (
          <TokenDetail token={selectedToken} onBack={() => { selectToken("", null); resetTrade(); }} />
        ) : (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
            {/* Search bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(153,69,255,0.4)", fontSize: 14, pointerEvents: "none" }}>⬡</span>
                <input
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                  placeholder="Search tokens..."
                  style={{
                    width: "100%", height: 42, paddingLeft: 36, paddingRight: 16,
                    background: "rgba(153,69,255,0.06)", border: "1px solid rgba(153,69,255,0.2)",
                    borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "monospace",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 42, borderRadius: 12, background: "rgba(153,69,255,0.06)", border: "1px solid rgba(153,69,255,0.15)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 6px #14F195", animation: "pulse 1.5s infinite" }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 11 }}>{filteredTokens.length} tokens</span>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                <span style={{ color: "rgba(153,69,255,0.4)", fontFamily: "monospace", fontSize: 13 }}>Loading tokens...</span>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                <span style={{ color: "rgba(255,255,255,0.08)", fontFamily: "monospace", fontSize: 13 }}>NO_TOKENS_FOUND</span>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(153,69,255,0.2); border-radius: 2px; }
        input::placeholder { color: rgba(153,69,255,0.3); }
      `}</style>
    </div>
  );
}