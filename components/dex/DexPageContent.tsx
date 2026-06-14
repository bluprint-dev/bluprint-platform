"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DexHeader from "@/components/dex/Header";
import TradePanel from "@/components/dex/TradePanel";
import TokenModal from "@/components/dex/TokenModal";
import { useDexTokens } from "@/hooks/useDexTokens";
import { useBondingCurveInfo } from "@/hooks/useBondingCurveInfo";
import { useSwap } from "@/hooks/useSwap";
import { useDexStore } from "@/store/dexStore";
import { filterTokens } from "@/lib/dex/normalizeToken";
import { useTrades } from "@/hooks/useTrades";
import type { DexToken } from "@/types/dex";

// ─── TOKEN AVATAR ────────────────────────────────────────────────────────────
function TokenAvatar({ token, size = 48 }: { token: DexToken; size?: number }) {
  if (token.imageUrl) {
    return (
      <img src={token.imageUrl} alt={token.symbol} style={{
        width: size, height: size, borderRadius: "50%", objectFit: "cover",
        border: "2px solid rgba(153,69,255,0.3)", flexShrink: 0,
      }} loading="lazy" />
    );
  }
  const colors = ["#9945FF,#14F195", "#ff2d95,#9945FF", "#14F195,#0fa96a", "#ff6bcb,#ff2d95"];
  const grad = colors[(token.symbol.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${grad})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 900, color: "#fff",
      border: "2px solid rgba(153,69,255,0.2)",
    }}>
      {token.symbol.charAt(0)}
    </div>
  );
}

// ─── TOKEN LIST CARD (ana liste) ─────────────────────────────────────────────
function TokenListCard({
  token,
  isNew,
  onClick,
}: {
  token: DexToken;
  isNew: boolean;
  onClick: () => void;
}) {
  const age = token.createdAt
    ? Math.floor((Date.now() - token.createdAt) / 60000)
    : null;
  const ageText = age === null ? "" : age < 60 ? `${age}m` : age < 1440 ? `${Math.floor(age / 60)}h` : `${Math.floor(age / 1440)}d`;

  return (
    <div
      onClick={onClick}
      style={{
        background: isNew
          ? "linear-gradient(135deg, rgba(153,69,255,0.15), rgba(20,241,149,0.08))"
          : "rgba(255,255,255,0.02)",
        border: isNew
          ? "1px solid rgba(153,69,255,0.5)"
          : "1px solid rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s",
        animation: isNew ? "slideIn 0.4s ease" : undefined,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = "rgba(153,69,255,0.1)";
        el.style.borderColor = "rgba(153,69,255,0.4)";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 8px 32px rgba(153,69,255,0.15)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = isNew
          ? "linear-gradient(135deg, rgba(153,69,255,0.15), rgba(20,241,149,0.08))"
          : "rgba(255,255,255,0.02)";
        el.style.borderColor = isNew ? "rgba(153,69,255,0.5)" : "rgba(255,255,255,0.05)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {isNew && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "linear-gradient(135deg, #9945FF, #14F195)",
          borderRadius: 4, padding: "2px 6px",
          fontSize: 8, fontFamily: "monospace", fontWeight: 700, color: "#fff",
          letterSpacing: "0.1em", animation: "pulse 1.5s infinite",
        }}>NEW</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <TokenAvatar token={token} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {token.name}
            </span>
            <span style={{
              color: "#14F195", fontFamily: "monospace", fontSize: 10, fontWeight: 700,
              background: "rgba(20,241,149,0.08)", padding: "1px 6px", borderRadius: 4, flexShrink: 0,
            }}>${token.symbol}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 10 }}>
              {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
            </span>
            {ageText && (
              <span style={{ color: "rgba(153,69,255,0.5)", fontFamily: "monospace", fontSize: 10 }}>
                · {ageText} ago
              </span>
            )}
          </div>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(153,69,255,0.1)",
          border: "1px solid rgba(153,69,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(153,69,255,0.6)", fontSize: 16, flexShrink: 0,
          transition: "all 0.2s",
        }}>›</div>
      </div>
    </div>
  );
}

// ─── TOKEN DETAIL (coin'e tıklanınca açılan ekran) ──────────────────────────
function TokenDetail({
  token,
  onBack,
}: {
  token: DexToken;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState("Trades");
  const [mobileTradeOpen, setMobileTradeOpen] = useState(false);

  const {
    isBuy, amount, selectedGenesisAccount,
    setIsBuy, setAmount, resetTrade,
  } = useDexStore();

  const genesisAccount = selectedGenesisAccount ?? token.genesisAccount ?? token.mint;
  const { data: curveInfo, isLoading: isLoadingCurve } = useBondingCurveInfo(genesisAccount);
  const { swap, isSwapping, error: swapError, setError: setSwapError } = useSwap();
  const { trades, isLoading: isLoadingTrades } = useTrades(token.mint);

  const handleSwap = async () => {
    if (!amount) return;
    const ok = await swap({
      genesisAccount,
      mint: token.mint,
      amount,
      isBuy,
    });
    if (ok) resetTrade();
  };

  const TABS = ["Trades", "Holders", "Security", "Top Traders", "Markets"];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>

      {/* LEFT: Chart + Tabs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Token header bar */}
        <div style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(153,69,255,0.1)",
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(153,69,255,0.03)",
          flexShrink: 0,
        }}>
          <button onClick={onBack} style={{
            background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.2)",
            borderRadius: 8, padding: "6px 12px", color: "rgba(153,69,255,0.8)",
            fontFamily: "monospace", fontSize: 11, cursor: "pointer", flexShrink: 0,
          }}>← Back</button>

          <TokenAvatar token={token} size={36} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{token.name}</span>
              <span style={{ color: "rgba(153,69,255,0.8)", fontFamily: "monospace", fontSize: 11, background: "rgba(153,69,255,0.1)", padding: "1px 6px", borderRadius: 4 }}>
                ${token.symbol}
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 10 }}>
              {token.mint.slice(0, 8)}...{token.mint.slice(-6)}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, marginLeft: 16, flexWrap: "wrap" }}>
            {[
              { label: "CURVE", value: `${(curveInfo?.lifecycle?.fillPercent ?? 0).toFixed(2)}%` },
              { label: "TRADES", value: String(trades.length) },
            ].map(s => (
              <div key={s.label}>
                <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em" }}>{s.label}</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 8px #14F195", animation: "pulse 2s infinite" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: 10 }}>LIVE</span>
          </div>
        </div>

        {/* Birdeye Chart */}
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <iframe
            src={`https://birdeye.so/tv-widget/${token.mint}?chain=solana&viewMode=pair&chartInterval=15&chartType=Candle&chartTimezone=UTC&chartLeftToolbar=show&theme=dark`}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="clipboard-write"
            allowFullScreen
          />
        </div>

        {/* Tabs */}
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(153,69,255,0.1)" }}>
          <div style={{
            display: "flex", gap: 0,
            borderBottom: "1px solid rgba(153,69,255,0.08)",
            background: "rgba(153,69,255,0.02)",
            overflowX: "auto",
          }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 18px", border: "none", cursor: "pointer",
                fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.06em", whiteSpace: "nowrap",
                background: "transparent",
                color: activeTab === tab ? "#14F195" : "rgba(255,255,255,0.3)",
                borderBottom: activeTab === tab ? "2px solid #14F195" : "2px solid transparent",
                transition: "all 0.15s",
              }}>{tab}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ height: 200, overflowY: "auto" }} className="custom-scroll">
            {activeTab === "Trades" && (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "55px 90px 1fr 60px 110px",
                  padding: "6px 16px", borderBottom: "1px solid rgba(153,69,255,0.06)",
                }}>
                  {["TYPE", "SOL", "TOKENS", "TIME", "MAKER"].map(h => (
                    <span key={h} style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em" }}>{h}</span>
                  ))}
                </div>
                {isLoadingTrades ? (
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <span style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 10 }}>Loading...</span>
                  </div>
                ) : trades.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.08)", fontFamily: "monospace", fontSize: 10 }}>AWAITING_TRANSACTIONS...</span>
                  </div>
                ) : (
                  trades.map(trade => (
                    <div key={trade.id} style={{
                      display: "grid", gridTemplateColumns: "55px 90px 1fr 60px 110px",
                      padding: "7px 16px", borderBottom: "1px solid rgba(153,69,255,0.04)", alignItems: "center",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(153,69,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: trade.is_buy ? "#14F195" : "#ff2d95" }}>
                        {trade.is_buy ? "BUY" : "SELL"}
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                        {trade.amount_sol.toFixed(4)} SOL
                      </span>
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
                  ))
                )}
              </>
            )}
            {activeTab !== "Trades" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <span style={{ color: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: 10 }}>COMING_SOON</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Trade Panel */}
      <div style={{
        width: 320, flexShrink: 0,
        borderLeft: "1px solid rgba(153,69,255,0.1)",
        overflowY: "auto", padding: 16,
      }} className="custom-scroll">
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

// ─── MAIN DEX PAGE ────────────────────────────────────────────────────────────
export default function DexPageContent() {
  const searchParams = useSearchParams();
  const mintFromUrl = searchParams.get("mint");
  const [searchInput, setSearchInput] = useState("");
  const [newMints, setNewMints] = useState<Set<string>>(new Set());
  const prevMintsRef = useRef<Set<string>>(new Set());

  const {
    search, selectedMint, selectedGenesisAccount,
    setSearch, selectToken, resetTrade,
  } = useDexStore();

  const { tokens, isLoading, isFetching, refresh } = useDexTokens();

  const filteredTokens = useMemo(() => {
    const base = filterTokens(tokens, search);
    return [...base].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 50);
  }, [tokens, search]);

  // Yeni token animasyonu
  useEffect(() => {
    const currentMints = new Set(filteredTokens.map(t => t.mint));
    const added = new Set<string>();
    currentMints.forEach(m => {
      if (!prevMintsRef.current.has(m) && prevMintsRef.current.size > 0) {
        added.add(m);
      }
    });
    if (added.size > 0) {
      setNewMints(prev => new Set([...prev, ...added]));
      setTimeout(() => {
        setNewMints(prev => {
          const next = new Set(prev);
          added.forEach(m => next.delete(m));
          return next;
        });
      }, 5000);
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

  const handleSelectToken = (token: DexToken) => {
    selectToken(token.mint, token.genesisAccount ?? null);
    resetTrade();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", color: "#fff" }}>
      {/* Ambient bg */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(153,69,255,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,241,149,0.04) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <DexHeader onRefresh={() => refresh()} isRefreshing={isFetching} />

        {selectedToken ? (
          <TokenDetail token={selectedToken} onBack={() => { selectToken("", null); resetTrade(); }} />
        ) : (
          /* TOKEN LIST */
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

            {/* Search + count */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(153,69,255,0.4)", fontSize: 14, pointerEvents: "none" }}>⬡</span>
                <input
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                  placeholder="Search tokens..."
                  style={{
                    width: "100%", height: 44,
                    paddingLeft: 36, paddingRight: 16,
                    background: "rgba(153,69,255,0.06)",
                    border: "1px solid rgba(153,69,255,0.2)",
                    borderRadius: 12, color: "#fff", fontSize: 14,
                    fontFamily: "monospace", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{
                padding: "0 14px", height: 44, borderRadius: 12,
                background: "rgba(153,69,255,0.06)", border: "1px solid rgba(153,69,255,0.15)",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 6px #14F195", animation: "pulse 1.5s infinite" }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 11 }}>
                  {filteredTokens.length} tokens
                </span>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <span style={{ color: "rgba(153,69,255,0.4)", fontFamily: "monospace", fontSize: 13 }}>Loading tokens...</span>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <span style={{ color: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: 13 }}>NO_TOKENS_FOUND</span>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}>
                {filteredTokens.map(token => (
                  <TokenListCard
                    key={token.mint}
                    token={token}
                    isNew={newMints.has(token.mint)}
                    onClick={() => handleSelectToken(token)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(153,69,255,0.2); border-radius: 2px; }
        input::placeholder { color: rgba(153,69,255,0.3); }
      `}</style>
    </div>
  );
}