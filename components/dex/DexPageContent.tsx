"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet as WalletIcon } from "lucide-react";
// DexHeader kaldırıldı — yerine sade "Axor.fun" logosu kullanılıyor
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

// ─── HELPERS ───────────────────────────────────────────────────────────────

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

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --purple: #D4AF7A;
    --green: #E8C989;
    --pink: #B8935E;
    --dark: #0A0A0C;
    --card: rgba(255,255,255,0.035);
    --border: rgba(212,175,122,0.18);
    --border-green: rgba(232,201,137,0.22);
    --text-muted: rgba(255,255,255,0.35);
  }

  .glass {
    position: relative;
    background: linear-gradient(150deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015) 45%, rgba(212,175,122,0.035));
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid rgba(212,175,122,0.16);
    border-radius: 20px;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.07) inset,
      0 0 0 1px rgba(0,0,0,0.25),
      0 24px 48px -20px rgba(0,0,0,0.65),
      0 0 50px -24px rgba(212,175,122,0.18);
    transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1);
  }
  .glass:hover {
    border-color: rgba(212,175,122,0.3);
    transform: translateY(-3px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.09) inset,
      0 0 0 1px rgba(0,0,0,0.25),
      0 28px 56px -20px rgba(0,0,0,0.7),
      0 0 70px -18px rgba(212,175,122,0.26);
  }

  .tabnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }

  .grain-overlay {
    position: fixed; inset: 0; z-index: 2; pointer-events: none;
    opacity: 0.035; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .glass-expanded {
    border-color: rgba(212,175,122,0.4) !important;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.1) inset,
      0 0 0 1px rgba(0,0,0,0.3),
      0 32px 64px -18px rgba(0,0,0,0.75),
      0 0 90px -14px rgba(212,175,122,0.32) !important;
  }

  .dex-input {
    background: rgba(255,255,255,0.045);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(212,175,122,0.22);
    border-radius: 12px;
    color: #EDEBE6;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    padding: 12px 16px 12px 42px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .dex-input:focus {
    border-color: rgba(212,175,122,0.55);
    background: rgba(255,255,255,0.065);
    box-shadow: 0 0 0 4px rgba(212,175,122,0.1), 0 0 24px -6px rgba(212,175,122,0.3);
  }
  .dex-input::placeholder { color: rgba(212,175,122,0.32); }

  .skeleton {
    background: linear-gradient(90deg, rgba(212,175,122,0.05) 25%, rgba(212,175,122,0.1) 50%, rgba(212,175,122,0.05) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
  }

  .dex-scroll::-webkit-scrollbar { width: 3px; }
  .dex-scroll::-webkit-scrollbar-track { background: transparent; }
  .dex-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,122,0.2); border-radius: 2px; }

  .trending-scroll::-webkit-scrollbar { height: 4px; }
  .trending-scroll::-webkit-scrollbar-track { background: transparent; }
  .trending-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,122,0.2); border-radius: 2px; }

  .explore-table-row:hover { background: rgba(212,175,122,0.045); }

  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cardIn  { from{opacity:0;transform:translateY(-8px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes popIn   { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes bgRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes netPing { 0%{transform:scale(1);opacity:0.8} 75%{transform:scale(2.6);opacity:0} 100%{transform:scale(1);opacity:0} }
  @keyframes gridGlow { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.8)} }
  @keyframes whaleIn { from{opacity:0;transform:translateY(-10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes glow    { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes copyPop { from{transform:scale(0.92)} to{transform:scale(1)} }

  /* Fener isigi gibi soldan saga kayan parlama - her 5 saniyede bir */
  @keyframes shineSweep {
    0%   { background-position: -140% 0; }
    18%  { background-position: 140% 0; }
    100% { background-position: 140% 0; }
  }

  .axor-logo-shine {
    display: inline-block;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.01em;
    background: linear-gradient(
      100deg,
      #B8935E 0%,
      #B8935E 40%,
      #D4AF7A 46%,
      #FCEBC9 50%,
      #D4AF7A 54%,
      #B8935E 60%,
      #B8935E 100%
    );
    background-size: 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shineSweep 5s ease-in-out infinite;
  }

  .token-card {
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s, border-color 0.22s;
    border: 1px solid rgba(212,175,122,0.15);
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255,255,255,0.03);
    position: relative;
  }
  .token-card:hover {
    transform: translateY(-4px) scale(1.012);
    border-color: rgba(212,175,122,0.4);
    box-shadow: 0 8px 32px rgba(212,175,122,0.18), 0 2px 8px rgba(0,0,0,0.4);
  }

  .stat-chip {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 18px;
    border-right: 1px solid rgba(212,175,122,0.07);
  }

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

  .trend-row {
    cursor: pointer;
    position: relative;
    transition: background 0.15s;
  }
  .trend-row:hover { background: rgba(212,175,122,0.05); }
  .trend-preview {
    position: absolute;
    left: 100%;
    top: 0;
    margin-left: 8px;
    width: 260px;
    height: 140px;
    pointer-events: none;
    z-index: 30;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.15s, transform 0.15s;
  }
  .trend-row:hover .trend-preview {
    opacity: 1;
    transform: translateX(0);
  }

  .dex-blocks-desktop { display: block; }
  .dex-blocks-mobile  { display: none; }

  @media (max-width: 1100px) {
    .dex-blocks-desktop { display: none !important; }
    .dex-blocks-mobile  { display: block !important; }
    .trend-preview { display: none !important; }
  }
  @media (max-width: 768px) {
    .detail-layout { flex-direction: column !important; height: auto !important; overflow: auto !important; }
    .detail-left   { min-height: 0 !important; flex: none !important; }
    .detail-right  { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(212,175,122,0.1) !important; }
    .chart-area    { height: 260px !important; min-height: 260px !important; }
    .tabs-area     { height: auto !important; }
    .tabs-scroll   { height: 220px !important; }
    .top-bar       { flex-wrap: wrap !important; gap: 8px !important; height: auto !important; padding: 10px 14px !important; }
    .top-bar-stats { display: none !important; }
    .token-grid    { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; gap: 10px !important; }
    .search-row    { flex-wrap: wrap !important; gap: 8px !important; }
    .search-row > * { flex: 1 1 auto !important; min-width: 0 !important; }
    .trade-row-grid { grid-template-columns: 46px 1fr 1fr 36px !important; }
    .trade-row-mcap, .trade-row-maker { display: none !important; }
    .trade-head-mcap, .trade-head-maker { display: none !important; }
    .stat-chip { padding: 0 10px !important; }
    .page-pad  { padding: 20px 14px 80px !important; }
    .back-btn-label { display: none !important; }
    .trending-scroll > div { min-width: 150px !important; }
  }
`;

// ─── BACKGROUND ────────────────────────────────────────────────────────────

function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,175,122,0.12) 0%, transparent 70%)" }} />

      {/* Yavas donen halka - arka plana derinlik ve hareket hissi katar, dikkat dagitmayacak kadar yavas (90s) */}
      <div style={{
        position: "absolute", width: "160vmax", height: "160vmax", left: "50%", top: "50%",
        marginLeft: "-80vmax", marginTop: "-80vmax",
        background: "conic-gradient(from 0deg, transparent 0deg, rgba(212,175,122,0.05) 60deg, transparent 140deg, transparent 220deg, rgba(232,201,137,0.04) 280deg, transparent 340deg)",
        animation: "bgRotate 90s linear infinite",
      }} />

      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,122,0.08) 0%, transparent 70%)",
        top: -200, left: -200, animation: "float 18s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,201,137,0.06) 0%, transparent 70%)",
        bottom: -100, right: -100, animation: "float 22s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,122,0.05) 0%, transparent 70%)",
        top: "45%", left: "55%", animation: "float 28s ease-in-out infinite 6s",
      }} />
      <div style={{
        position: "absolute", width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(184,147,94,0.05) 0%, transparent 70%)",
        top: "70%", left: "20%", animation: "float 24s ease-in-out infinite 3s",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(212,175,122,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,122,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Grid uzerinde yavasca yanip sonen altin nokta isiklari - "canli ekosistem" hissi */}
      {[
        { top: "12%", left: "18%", delay: "0s",   dur: "6s" },
        { top: "34%", left: "72%", delay: "1.4s", dur: "7s" },
        { top: "62%", left: "40%", delay: "2.8s", dur: "5.5s" },
        { top: "78%", left: "85%", delay: "0.8s", dur: "6.5s" },
        { top: "48%", left: "8%",  delay: "3.6s", dur: "7.5s" },
      ].map((p, i) => (
        <div key={i} style={{
          position: "absolute", top: p.top, left: p.left,
          width: 4, height: 4, borderRadius: "50%",
          background: "#D4AF7A",
          boxShadow: "0 0 12px 3px rgba(212,175,122,0.6)",
          animation: `gridGlow ${p.dur} ease-in-out ${p.delay} infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── TOKEN AVATAR ──────────────────────────────────────────────────────────

function TokenAvatar({ token, size = 48 }: { token: DexToken; size?: number }) {
  const grads = ["#D4AF7A,#E8C989", "#B8935E,#D4AF7A", "#E8C989,#C9A876", "#F0D9A8,#B8935E"];
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
      fontSize: size * 0.42, fontWeight: 900, color: "#EDEBE6",
      fontFamily: "'Orbitron', monospace",
    }}>
      {token.symbol.charAt(0)}
    </div>
  );
}

// ─── TOKEN CARD ────────────────────────────────────────────────────────────

function TokenCard({ token, isNew, onClick }: { token: DexToken; isNew: boolean; onClick: () => void }) {
  const age = token.createdAt ? Date.now() - token.createdAt : null;

  // Gercek canli mcap + bonding curve verisi (uydurma degil)
  const genesisAccount = token.genesisAccount ?? token.mint;
  const { data: curveInfo, isLoading: isLoadingCurve } = useBondingCurveInfo(genesisAccount);
  const tokensPerSol = curveInfo?.price?.tokensPerSol ? Number(curveInfo.price.tokensPerSol) : null;
  const mcapSol = tokensPerSol && tokensPerSol > 0 ? TOTAL_SUPPLY / tokensPerSol : null;
  const fillPercent = Math.max(0, Math.min(curveInfo?.lifecycle?.fillPercent ?? 0, 100));
  const isGraduated = curveInfo?.lifecycle?.isGraduated ?? false;

  return (
    <div
      className="token-card"
      onClick={onClick}
      style={{ animation: isNew ? "cardIn 0.45s cubic-bezier(0.16,1,0.3,1)" : undefined }}
    >
      <div style={{ position: "relative", width: "100%", paddingBottom: "62%", background: "rgba(212,175,122,0.04)" }}>
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
            background: "linear-gradient(145deg, rgba(212,175,122,0.1), rgba(232,201,137,0.05))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Orbitron', monospace", fontSize: 40, fontWeight: 900,
            color: "rgba(212,175,122,0.25)",
          }}>
            {token.symbol.charAt(0)}
          </div>
        )}

        {isNew && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "linear-gradient(135deg, #D4AF7A, #E8C989)",
            borderRadius: 6, padding: "3px 9px",
            fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            color: "#0A0A0C", letterSpacing: "0.1em",
            animation: "popIn 0.4s cubic-bezier(0.16,1,0.3,1), pulse 1.8s ease-in-out 0.4s infinite",
            boxShadow: "0 0 16px rgba(212,175,122,0.5)",
          }}>✦ NEW</div>
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

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(8,6,18,0.92) 0%, transparent 100%)",
        }} />
      </div>

      <div style={{ padding: "10px 12px 12px", fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <span style={{
            color: "#EDEBE6", fontWeight: 700, fontSize: 12,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {token.name}
          </span>
          <span style={{
            color: "#E8C989", fontSize: 9, fontWeight: 700,
            background: "rgba(232,201,137,0.08)", border: "1px solid rgba(232,201,137,0.18)",
            padding: "2px 7px", borderRadius: 5, flexShrink: 0, letterSpacing: "0.05em",
          }}>${token.symbol}</span>
        </div>
        <div style={{
          color: "rgba(255,255,255,0.18)", fontSize: 10, letterSpacing: "0.04em",
          fontFamily: "monospace",
        }}>
          {token.mint.slice(0, 6)}···{token.mint.slice(-4)}
        </div>

        {/* Gercek canli MC + bonding curve durumu */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
          <div className="tabnum" style={{ fontSize: 13, fontWeight: 800, color: "#D4AF7A" }}>
            {isLoadingCurve ? (
              <span className="skeleton" style={{ display: "inline-block", width: 46, height: 13, borderRadius: 4, verticalAlign: "middle" }} />
            ) : mcapSol !== null ? (
              fmtMcap(mcapSol, SOL_PRICE_USD)
            ) : (
              <span style={{ color: "rgba(255,255,255,0.15)", fontWeight: 600, fontSize: 10 }}>MC —</span>
            )}
          </div>

          {isGraduated ? (
            <span style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "0.06em",
              color: "#0A0A0C", background: "linear-gradient(135deg,#D4AF7A,#E8C989)",
              padding: "2px 7px", borderRadius: 5,
            }}>GRADUATED</span>
          ) : !isLoadingCurve && curveInfo ? (
            <div style={{ flex: 1, maxWidth: 70, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{
                width: `${Math.max(fillPercent, 2)}%`, height: "100%", borderRadius: 2,
                background: "linear-gradient(90deg,#B8935E,#D4AF7A)",
              }} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── TOKEN LIST ROW (list view for Live Tokens block) ──────────────────────

function TokenListRow({ token, isNew, onClick }: { token: DexToken; isNew: boolean; onClick: () => void }) {
  const age = token.createdAt ? Date.now() - token.createdAt : null;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 10, cursor: "pointer",
        border: "1px solid rgba(212,175,122,0.08)",
        background: isNew ? "rgba(212,175,122,0.05)" : "transparent",
        transition: "background 0.15s, border-color 0.15s",
        marginBottom: 6,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,122,0.35)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(212,175,122,0.08)")}
    >
      <TokenAvatar token={token} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#EDEBE6", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{token.name}</span>
          <span style={{ color: "#E8C989", fontSize: 9, fontWeight: 700 }}>${token.symbol}</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontFamily: "monospace" }}>
          {token.mint.slice(0, 6)}···{token.mint.slice(-4)}
        </div>
      </div>
      {age !== null && (
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, flexShrink: 0 }}>{fmtAge(age)}</span>
      )}
    </div>
  );
}

// ─── LIVE TRADE ROW ────────────────────────────────────────────────────────

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
        borderBottom: "1px solid rgba(212,175,122,0.04)",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Space Grotesk', sans-serif",
        background: isNew
          ? trade.is_buy ? "rgba(232,201,137,0.03)" : "rgba(184,147,94,0.03)"
          : "transparent",
        transition: "background 1.8s ease",
        animation: isNew ? "slideIn 0.3s cubic-bezier(0.16,1,0.3,1)" : undefined,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,122,0.04)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "4px 0", borderRadius: 6,
        background: trade.is_buy ? "rgba(232,201,137,0.09)" : "rgba(184,147,94,0.09)",
        border: `1px solid ${trade.is_buy ? "rgba(232,201,137,0.2)" : "rgba(184,147,94,0.2)"}`,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800,
          color: trade.is_buy ? "#E8C989" : "#B8935E",
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

      <span className="trade-row-mcap" style={{ fontSize: 10, color: "rgba(212,175,122,0.65)", fontWeight: 600 }}>
        {mcapSol > 0 ? fmtMcap(mcapSol) : "—"}
      </span>

      <a
        className="trade-row-maker"
        href={trade.tx_signature ? `https://solscan.io/tx/${trade.tx_signature}` : "#"}
        target="_blank" rel="noopener noreferrer"
        style={{
          fontSize: 10, color: "rgba(212,175,122,0.4)",
          textDecoration: "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => ((e.target as HTMLElement).style.color = "#D4AF7A")}
        onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(212,175,122,0.4)")}
      >
        {trade.wallet.slice(0, 4)}···{trade.wallet.slice(-4)} ↗
      </a>
    </div>
  );
}

// ─── HOLDERS TAB ───────────────────────────────────────────────────────────

function HoldersTab({ mint }: { mint: string }) {
  const [holders, setHolders] = useState<{ address: string; amount: number; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(process.env.NEXT_PUBLIC_RPC_URL ?? "https://mainnet.helius-rpc.com/?api-key=fdbb8762-06b5-4bbd-ab1e-33310587e2d4", {
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
        <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.12, color: "#D4AF7A" }}>◈</div>
        <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}>
          No holder data available
        </div>
      </div>
    );
  }

  const top3Colors = ["#E8C989", "#D4AF7A", "#C9A876"];

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "32px 1fr 90px 130px",
        padding: "8px 18px 10px",
        borderBottom: "1px solid rgba(212,175,122,0.06)",
        gap: 8,
      }}>
        {["#", "WALLET", "TOKENS", "SHARE"].map(h => (
          <span key={h} style={{
            color: "rgba(212,175,122,0.3)", fontFamily: "'Space Grotesk', sans-serif",
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
            borderBottom: "1px solid rgba(212,175,122,0.03)",
            alignItems: "center", gap: 8, transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,122,0.04)")}
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
              {h.address.slice(0, 6)}···{h.address.slice(-4)} ↗
            </a>

            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
              {fmt(h.amount, 0)}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${Math.min(h.pct, 100)}%`,
                  background: isTop ? `linear-gradient(90deg, ${rankColor}70, ${rankColor})` : "linear-gradient(90deg, rgba(212,175,122,0.3), rgba(212,175,122,0.6))",
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

// ─── COPY ADDRESS BUTTON ───────────────────────────────────────────────────

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
        border: copied ? "1px solid rgba(232,201,137,0.45)" : "1px solid rgba(212,175,122,0.22)",
        background: copied ? "rgba(232,201,137,0.07)" : "rgba(212,175,122,0.06)",
        color: copied ? "#E8C989" : "rgba(212,175,122,0.65)",
        boxShadow: copied ? "0 0 14px rgba(232,201,137,0.2)" : "none",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        animation: copied ? "copyPop 0.25s" : undefined,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        if (!copied) {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "rgba(212,175,122,0.4)";
          b.style.color = "#D4AF7A";
          b.style.background = "rgba(212,175,122,0.1)";
        }
      }}
      onMouseLeave={e => {
        if (!copied) {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "rgba(212,175,122,0.22)";
          b.style.color = "rgba(212,175,122,0.65)";
          b.style.background = "rgba(212,175,122,0.06)";
        }
      }}
    >
      {copied ? (
        <>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E8C989" strokeWidth={3}>
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

// ─── TOKEN TRADE (chart + panel + tabs) — used inside the Create Token block ─
// compact=true: dikey (stacked) düzen, blok genişliğine sığar (morph hedefi)

function TokenTrade({ token, onBack, compact = true }: { token: DexToken; onBack: () => void; compact?: boolean }) {
  const [activeTab, setActiveTab] = useState<"Trades" | "Holders">("Trades");
  const [newTradeIds, setNewTradeIds] = useState<Set<number>>(new Set());
  const prevTradeIdsRef = useRef<Set<number>>(new Set());
  const [whaleAlert, setWhaleAlert] = useState<{ isBuy: boolean; amountSol: number } | null>(null);

  const { isBuy, amount, selectedGenesisAccount, setIsBuy, setAmount, resetTrade } = useDexStore();
  const genesisAccount = selectedGenesisAccount ?? token.genesisAccount ?? token.mint;
  const { data: curveInfo, isLoading: isLoadingCurve } = useBondingCurveInfo(genesisAccount);
  const { swap, isSwapping, error: swapError } = useSwap();
  const { trades, isLoading: isLoadingTrades } = useTrades(token.mint);

  // Balina alarmi esigi: bu tutardan buyuk yeni bir islem gelirse ekranda gostericez
  const WHALE_THRESHOLD_SOL = 10;

  useEffect(() => {
    const currentIds = new Set(trades.map(t => t.id));
    const newIds = new Set<number>();
    currentIds.forEach(id => { if (!prevTradeIdsRef.current.has(id)) newIds.add(id); });
    if (newIds.size > 0 && prevTradeIdsRef.current.size > 0) {
      setNewTradeIds(newIds);
      setTimeout(() => setNewTradeIds(new Set()), 3000);

      // Gercek trade verisinden balina kontrolu (uydurma degil, amount_sol'dan)
      const whaleTrade = trades.find(t => newIds.has(t.id) && t.amount_sol >= WHALE_THRESHOLD_SOL);
      if (whaleTrade) {
        setWhaleAlert({ isBuy: whaleTrade.is_buy, amountSol: whaleTrade.amount_sol });
        setTimeout(() => setWhaleAlert(null), 4500);
      }
    }
    prevTradeIdsRef.current = currentIds;
  }, [trades]);

  const handleSwap = async () => {
    if (!amount) return;
    const ok = await swap({ genesisAccount, mint: token.mint, amount, isBuy });
    if (ok) resetTrade();
  };

  const volumeSol = trades.reduce((s, t) => s + t.amount_sol, 0);

  return (
    <div style={{ display: "flex", flexDirection: compact ? "column" : "row", background: "#0A0A0C", position: "relative" }}>
      {whaleAlert && (
        <div
          style={{
            position: "absolute", top: 8, left: 8, right: 8, zIndex: 40,
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 14px", borderRadius: 12,
            background: whaleAlert.isBuy ? "rgba(232,201,137,0.14)" : "rgba(184,147,94,0.14)",
            border: `1px solid ${whaleAlert.isBuy ? "rgba(232,201,137,0.5)" : "rgba(184,147,94,0.5)"}`,
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            boxShadow: `0 0 30px -6px ${whaleAlert.isBuy ? "rgba(232,201,137,0.6)" : "rgba(184,147,94,0.6)"}`,
            animation: "whaleIn 0.35s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span style={{ fontSize: 15 }}>{whaleAlert.isBuy ? "🐋" : "🐳"}</span>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 800,
            letterSpacing: "0.04em",
            color: whaleAlert.isBuy ? "#E8C989" : "#EDEBE6",
          }}>
            WHALE {whaleAlert.isBuy ? "BOUGHT" : "SOLD"} {whaleAlert.amountSol.toFixed(1)} SOL OF ${token.symbol}
          </span>
        </div>
      )}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0,
        outline: whaleAlert ? `2px solid ${whaleAlert.isBuy ? "rgba(232,201,137,0.6)" : "rgba(184,147,94,0.6)"}` : "none",
        outlineOffset: -2,
        transition: "outline-color 0.3s ease",
      }}>
        {/* Top bar */}
        <div style={{
          padding: "0 14px", borderBottom: "1px solid rgba(212,175,122,0.1)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0, height: 52,
          background: "rgba(8,6,18,0.97)",
        }}>
          <button onClick={onBack} style={{
            background: "rgba(212,175,122,0.07)", border: "1px solid rgba(212,175,122,0.18)",
            borderRadius: 9, padding: "6px 11px", color: "rgba(212,175,122,0.65)",
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700,
            cursor: "pointer", flexShrink: 0, letterSpacing: "0.05em",
          }}>← BACK</button>

          <TokenAvatar token={token} size={26} />

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#EDEBE6", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{token.name}</span>
              <span style={{ color: "#E8C989", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>${token.symbol}</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.17)", fontSize: 9, fontFamily: "monospace" }}>
              {volumeSol > 0 ? `${volumeSol.toFixed(2)} SOL vol` : "no volume yet"} · {trades.length} trades
            </div>
          </div>

          <CopyAddressButton address={token.mint} />
        </div>

        {/* Chart */}
        <div style={{ height: compact ? 220 : undefined, flex: compact ? undefined : 1, minHeight: 0, background: "#07060f", position: "relative" }}>
          <TradeChart mint={token.mint} trades={trades} />
        </div>

        {/* Trade Panel (compact modda chart altında, tam genişlikte) */}
        {compact && (
          <div style={{ padding: 12, borderTop: "1px solid rgba(212,175,122,0.08)" }}>
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
        )}

        {/* Tabs */}
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(212,175,122,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(212,175,122,0.07)", padding: "0 4px" }}>
            {(["Trades", "Holders"] as const).map(tab => (
              <button
                key={tab}
                className="tab-btn"
                onClick={() => setActiveTab(tab)}
                style={{
                  color: activeTab === tab ? "#EDEBE6" : "rgba(255,255,255,0.2)",
                  borderBottom: activeTab === tab ? "2px solid #D4AF7A" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.toUpperCase()}
                {tab === "Trades" && trades.length > 0 && (
                  <span style={{
                    background: activeTab === "Trades" ? "rgba(212,175,122,0.15)" : "rgba(255,255,255,0.05)",
                    color: activeTab === "Trades" ? "#D4AF7A" : "rgba(255,255,255,0.2)",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 800,
                    padding: "1px 6px", borderRadius: 4,
                  }}>{trades.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="dex-scroll" style={{ maxHeight: 220, overflowY: "auto" }}>
            {activeTab === "Trades" && (
              isLoadingTrades ? (
                <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : trades.length === 0 ? (
                <div style={{ padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No trades yet</div>
                </div>
              ) : (
                trades.map(trade => <TradeRow key={trade.id} trade={trade} isNew={newTradeIds.has(trade.id)} />)
              )
            )}
            {activeTab === "Holders" && <HoldersTab mint={token.mint} />}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="dex-scroll" style={{ width: 304, flexShrink: 0, borderLeft: "1px solid rgba(212,175,122,0.08)", overflowY: "auto", padding: 14 }}>
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
      )}
    </div>
  );
}

// --- WALLET BUTTON ------------------------------------------------------------
// Sag ustte gosterilen cam/sampanya temali cuzdan baglama butonu.
// Bagli degilken tiklaninca wallet-adapter modal'ini acar, bagliyken kisaltilmis
// adresi + baglantiyi kesme secenegini gosterir.

function WalletButton() {
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 999,
          color: "#D4AF7A",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        <WalletIcon size={14} />
        Connect Wallet
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px 7px 7px",
          borderRadius: 999,
          color: "#EDEBE6",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "linear-gradient(135deg, #D4AF7A, #E8C989)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 10px rgba(212,175,122,0.5)",
        }}>
          <WalletIcon size={12} color="#0A0A0C" />
        </div>
        {publicKey ? shortenAddress(publicKey.toString()) : ""}
      </button>

      {menuOpen && (
        <div
          className="glass"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 60,
            padding: 6, minWidth: 150,
            animation: "fadeUp 0.18s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <button
            onClick={() => { disconnect(); setMenuOpen(false); }}
            style={{
              width: "100%", textAlign: "left",
              padding: "8px 10px", borderRadius: 10,
              background: "transparent", border: "none",
              color: "#B8935E", fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,175,122,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Baglantiyi kes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TRENDING / FILTER CONSTANTS ───────────────────────────────────────────

const TRENDING_MCAP_THRESHOLD_USD = 100_000;
const CATEGORIES = ["All", "Charity", "Agents", "Movers", "Mayhem"] as const;
type Category = (typeof CATEGORIES)[number];

// ─── MCAP PROBE ─────────────────────────────────────────────────────────────
// Gorunmez yardimci bilesen: her token icin gercek mcap/graduated verisini
// (useBondingCurveInfo uzerinden) ceker ve parent'a bildirir. TokenCard zaten
// ayni hook'u kendi icinde de cagiriyor; ikisi ayni genesisAccount key'ini
// kullandigi icin React Query cache'i paylasilir, ekstra network istegi olmaz.
// Bu sayede Trending/Filter icin "gercek veri, uydurma yok" kurali korunur.

function McapProbe({
  token,
  onUpdate,
}: {
  token: DexToken;
  onUpdate: (mint: string, data: { mcapSol: number | null; isGraduated: boolean }) => void;
}) {
  const genesisAccount = token.genesisAccount ?? token.mint;
  const { data: curveInfo } = useBondingCurveInfo(genesisAccount);
  const tokensPerSol = curveInfo?.price?.tokensPerSol ? Number(curveInfo.price.tokensPerSol) : null;
  const mcapSol = tokensPerSol && tokensPerSol > 0 ? TOTAL_SUPPLY / tokensPerSol : null;
  const isGraduated = !!curveInfo?.lifecycle?.isGraduated;

  useEffect(() => {
    onUpdate(token.mint, { mcapSol, isGraduated });
    // onUpdate bilerek dependency'den haric tutuldu; parent useCallback ile
    // referansini sabit tutuyor, aksi halde sonsuz dongu olusabilir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token.mint, mcapSol, isGraduated]);

  return null;
}

// ─── MCAP FILTER POPOVER ────────────────────────────────────────────────────

function McapFilterPopover({
  minMcap,
  maxMcap,
  onApply,
  onReset,
}: {
  minMcap: number | null;
  maxMcap: number | null;
  onApply: (min: number | null, max: number | null) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [minInput, setMinInput] = useState(minMcap !== null ? String(minMcap) : "");
  const [maxInput, setMaxInput] = useState(maxMcap !== null ? String(maxMcap) : "");
  const active = minMcap !== null || maxMcap !== null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="glass"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 14px", borderRadius: 12, cursor: "pointer",
          color: active ? "#D4AF7A" : "rgba(255,255,255,0.5)",
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
          border: active ? "1px solid rgba(212,175,122,0.5)" : "1px solid transparent",
          whiteSpace: "nowrap",
        }}
      >
        ⚙ Filter
        {active && (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4AF7A", boxShadow: "0 0 6px #D4AF7A" }} />
        )}
      </button>

      {open && (
        <div
          className="glass"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 60,
            padding: 16, width: 240, animation: "fadeUp 0.18s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "rgba(212,175,122,0.5)", marginBottom: 10 }}>
            MARKET CAP (USD)
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              className="dex-input"
              style={{ padding: "9px 10px", fontSize: 12 }}
              placeholder="Min"
              inputMode="numeric"
              value={minInput}
              onChange={e => setMinInput(e.target.value.replace(/[^0-9]/g, ""))}
            />
            <input
              className="dex-input"
              style={{ padding: "9px 10px", fontSize: 12 }}
              placeholder="Max"
              inputMode="numeric"
              value={maxInput}
              onChange={e => setMaxInput(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { onReset(); setMinInput(""); setMaxInput(""); setOpen(false); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 11, fontWeight: 700,
              }}
            >Reset</button>
            <button
              onClick={() => {
                onApply(minInput ? Number(minInput) : null, maxInput ? Number(maxInput) : null);
                setOpen(false);
              }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer", border: "none",
                background: "linear-gradient(135deg,#B8935E,#D4AF7A)", color: "#0A0A0C",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 800,
              }}
            >Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CATEGORY TABS ──────────────────────────────────────────────────────────
// NOT: DexToken tipinde henuz bir `category` alani yok (backend ihtiyaclari
// listesinde belirtilmisti). Backend eklenene kadar "All" disindaki sekmeler
// bos liste gosterecek — UI hazir, veri geldiginde otomatik calisir.

function CategoryTabs({ active, onChange }: { active: Category; onChange: (c: Category) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={{
            padding: "9px 14px", borderRadius: 12, whiteSpace: "nowrap", cursor: "pointer",
            border: `1px solid rgba(212,175,122,${active === cat ? 0.5 : 0.14})`,
            background: active === cat ? "rgba(212,175,122,0.14)" : "rgba(255,255,255,0.02)",
            color: active === cat ? "#D4AF7A" : "rgba(255,255,255,0.4)",
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── TOKEN TABLE ROW (table view for Explore Coins) ────────────────────────

function TokenTableRow({ token, onClick }: { token: DexToken; onClick: () => void }) {
  const age = token.createdAt ? Date.now() - token.createdAt : null;
  const genesisAccount = token.genesisAccount ?? token.mint;
  const { data: curveInfo, isLoading } = useBondingCurveInfo(genesisAccount);
  const tokensPerSol = curveInfo?.price?.tokensPerSol ? Number(curveInfo.price.tokensPerSol) : null;
  const mcapSol = tokensPerSol && tokensPerSol > 0 ? TOTAL_SUPPLY / tokensPerSol : null;
  const isGraduated = !!curveInfo?.lifecycle?.isGraduated;
  const fillPercent = Math.max(0, Math.min(curveInfo?.lifecycle?.fillPercent ?? 0, 100));

  return (
    <div
      className="explore-table-row"
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: "1fr 110px 100px 60px",
        alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer",
        borderBottom: "1px solid rgba(212,175,122,0.05)", transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <TokenAvatar token={token} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#EDEBE6", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {token.name}
            </span>
            <span style={{ color: "#E8C989", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>${token.symbol}</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, fontFamily: "monospace" }}>
            {token.mint.slice(0, 6)}···{token.mint.slice(-4)}
          </div>
        </div>
      </div>

      <div className="tabnum" style={{ fontSize: 12, fontWeight: 700, color: "#D4AF7A" }}>
        {isLoading ? (
          <span className="skeleton" style={{ display: "inline-block", width: 44, height: 12, borderRadius: 4 }} />
        ) : mcapSol !== null ? (
          fmtMcap(mcapSol, SOL_PRICE_USD)
        ) : (
          <span style={{ color: "rgba(255,255,255,0.15)", fontWeight: 600, fontSize: 10 }}>—</span>
        )}
      </div>

      <div>
        {isGraduated ? (
          <span style={{
            fontSize: 8, fontWeight: 800, letterSpacing: "0.04em", color: "#0A0A0C",
            background: "linear-gradient(135deg,#D4AF7A,#E8C989)", padding: "2px 7px", borderRadius: 5,
          }}>GRADUATED</span>
        ) : !isLoading && curveInfo ? (
          <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${Math.max(fillPercent, 2)}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#B8935E,#D4AF7A)" }} />
          </div>
        ) : (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>—</span>
        )}
      </div>

      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>
        {age !== null ? fmtAge(age) : "—"}
      </div>
    </div>
  );
}

export default function DexPageContent() {
  const searchParams  = useSearchParams();
  const mintFromUrl   = searchParams.get("mint");
  const [searchInput, setSearchInput] = useState("");
  const [sortMode, setSortMode] = useState<"new" | "old">("new");
  const [category, setCategory] = useState<Category>("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [mcapMin, setMcapMin] = useState<number | null>(null);
  const [mcapMax, setMcapMax] = useState<number | null>(null);
  const [newMints, setNewMints]       = useState<Set<string>>(new Set());
  const prevMintsRef                  = useRef<Set<string>>(new Set());
  const [mcapMap, setMcapMap] = useState<Map<string, { mcapSol: number | null; isGraduated: boolean }>>(new Map());

  const { search, selectedMint, setSearch, selectToken, resetTrade } = useDexStore();
  const { tokens, isLoading }                                        = useDexTokens();

  const handleMcapUpdate = useCallback((mint: string, data: { mcapSol: number | null; isGraduated: boolean }) => {
    setMcapMap(prev => {
      const existing = prev.get(mint);
      if (existing && existing.mcapSol === data.mcapSol && existing.isGraduated === data.isGraduated) return prev;
      const next = new Map(prev);
      next.set(mint, data);
      return next;
    });
  }, []);

  // Arama + kategori filtresi (mcap filtresinden once, cunku Trending de bunun uzerine kurulu)
  const baseFiltered = useMemo(() => {
    let base = filterTokens(tokens, search);
    if (category !== "All") {
      base = base.filter(t => (t as any).category === category);
    }
    return base;
  }, [tokens, search, category]);

  // Explore Coins listesi: + mcap min/max filtresi + siralama
  const filteredTokens = useMemo(() => {
    let list = baseFiltered;
    if (mcapMin !== null || mcapMax !== null) {
      list = list.filter(t => {
        const info = mcapMap.get(t.mint);
        if (!info || info.mcapSol === null) return false;
        const usd = info.mcapSol * SOL_PRICE_USD;
        if (mcapMin !== null && usd < mcapMin) return false;
        if (mcapMax !== null && usd > mcapMax) return false;
        return true;
      });
    }
    const sorted = [...list].sort((a, b) =>
      sortMode === "new"
        ? (b.createdAt ?? 0) - (a.createdAt ?? 0)
        : (a.createdAt ?? 0) - (b.createdAt ?? 0)
    );
    return sorted.slice(0, 60);
  }, [baseFiltered, sortMode, mcapMin, mcapMax, mcapMap]);

  // Trending Coins: gercek mcap >= $100K olanlar, mcap'e gore siralanmis
  const trendingTokens = useMemo(() => {
    return baseFiltered
      .map(t => ({ t, info: mcapMap.get(t.mint) }))
      .filter(
        (x): x is { t: DexToken; info: { mcapSol: number; isGraduated: boolean } } =>
          !!x.info && x.info.mcapSol !== null && x.info.mcapSol * SOL_PRICE_USD >= TRENDING_MCAP_THRESHOLD_USD
      )
      .sort((a, b) => b.info.mcapSol - a.info.mcapSol)
      .map(x => x.t)
      .slice(0, 20);
  }, [baseFiltered, mcapMap]);

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

  const handleSelect = (token: DexToken) => {
    selectToken(token.mint, token.genesisAccount ?? null);
    resetTrade();
  };
  const handleBack = () => {
    selectToken("", null);
    resetTrade();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0C", color: "#EDEBE6", fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>
      <Background />
      <div className="grain-overlay" />

      {/* Gorunmez mcap probe'lari: Trending esigi ve mcap filtresi icin gercek veriyi toplar */}
      {baseFiltered.map(t => <McapProbe key={t.mint} token={t} onUpdate={handleMcapUpdate} />)}

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ padding: "20px 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="glass" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#D4AF7A",
              boxShadow: "0 0 8px 1px rgba(212,175,122,0.7)",
              animation: "glow 2.4s ease-in-out infinite",
            }} />
            <span className="axor-logo-shine">Axor.fun</span>
          </div>

          <WalletButton />
        </div>

        <div className="page-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "12px 20px 80px" }}>

          {selectedToken ? (
            <div className="glass" style={{ borderRadius: 20, overflow: "hidden", animation: "fadeUp 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
              <TokenTrade token={selectedToken} onBack={handleBack} compact={false} />
            </div>
          ) : (
            <>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 14px", marginBottom: 20,
                borderRadius: 10, background: "rgba(212,175,122,0.06)", border: "1px solid rgba(212,175,122,0.14)",
              }}>
                <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#E8C989", animation: "netPing 1.6s ease-out infinite" }} />
                  <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#E8C989", boxShadow: "0 0 6px #E8C989" }} />
                </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#E8C989" }}>
                  {tokens.length} TOKENS LIVE
                </span>
              </div>

              {/* ── TRENDING COINS ─────────────────────────────────────── */}
              {trendingTokens.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 15 }}>🔥</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: "0.03em", color: "#EDEBE6" }}>
                      Trending Coins
                    </span>
                    <span style={{ fontSize: 9, color: "rgba(212,175,122,0.4)", fontWeight: 700, letterSpacing: "0.04em" }}>
                      MCAP ≥ $100K
                    </span>
                  </div>
                  <div className="trending-scroll dex-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                    {trendingTokens.map(token => (
                      <div key={token.mint} style={{ minWidth: 190, flexShrink: 0 }}>
                        <TokenCard
                          token={token}
                          isNew={newMints.has(token.mint)}
                          onClick={() => handleSelect(token)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EXPLORE COINS ──────────────────────────────────────── */}
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: "0.03em", color: "#EDEBE6", marginBottom: 12 }}>
                Explore Coins
              </div>

              <div className="search-row" style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(212,175,122,0.4)", fontSize: 13, zIndex: 1 }}>{'\u2315'}</span>
                  <input
                    className="dex-input"
                    placeholder="Search by name or symbol..."
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value); }}
                  />
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {(["new", "old"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSortMode(mode)}
                      style={{
                        padding: "10px 16px", borderRadius: 12,
                        border: `1px solid rgba(212,175,122,${sortMode === mode ? 0.5 : 0.16})`,
                        background: sortMode === mode ? "rgba(212,175,122,0.14)" : "rgba(255,255,255,0.02)",
                        color: sortMode === mode ? "#D4AF7A" : "rgba(255,255,255,0.4)",
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.06em", cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      {mode === "new" ? "NEWEST" : "OLDEST"}
                    </button>
                  ))}
                </div>

                <McapFilterPopover
                  minMcap={mcapMin}
                  maxMcap={mcapMax}
                  onApply={(min, max) => { setMcapMin(min); setMcapMax(max); }}
                  onReset={() => { setMcapMin(null); setMcapMax(null); }}
                />

                <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 3, border: "1px solid rgba(212,175,122,0.14)" }}>
                  {(["grid", "table"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      title={mode === "grid" ? "Grid view" : "Table view"}
                      style={{
                        padding: "7px 11px", borderRadius: 9, border: "none", cursor: "pointer",
                        background: viewMode === mode ? "rgba(212,175,122,0.2)" : "transparent",
                        color: viewMode === mode ? "#D4AF7A" : "rgba(255,255,255,0.3)", fontSize: 13,
                      }}
                    >
                      {mode === "grid" ? "▦" : "☰"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <CategoryTabs active={category} onChange={setCategory} />
              </div>

              {isLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16, animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
              ) : filteredTokens.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)" }}>
                  No tokens found
                </div>
              ) : viewMode === "grid" ? (
                <div className="token-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {filteredTokens.map(token => (
                    <TokenCard
                      key={token.mint}
                      token={token}
                      isNew={newMints.has(token.mint)}
                      onClick={() => handleSelect(token)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass" style={{ borderRadius: 16, overflow: "hidden" }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 110px 100px 60px",
                    padding: "10px 16px", borderBottom: "1px solid rgba(212,175,122,0.1)",
                  }}>
                    {["COIN", "MCAP", "STATUS", "AGE"].map(h => (
                      <span key={h} style={{ color: "rgba(212,175,122,0.35)", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em" }}>{h}</span>
                    ))}
                  </div>
                  {filteredTokens.map(token => (
                    <TokenTableRow key={token.mint} token={token} onClick={() => handleSelect(token)} />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}