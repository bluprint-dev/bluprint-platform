"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Reorder } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet as WalletIcon } from "lucide-react";
// DexHeader kaldırıldı — yerine sade "Axor.fun" logosu kullanılıyor
import TradePanel from "@/components/dex/TradePanel";
import TradeChart from "@/components/dex/TradeChart";
import BlockShell, { ClosedBlockChip } from "@/components/dex/BlockShell";
import { useDexTokens } from "@/hooks/useDexTokens";
import { useBondingCurveInfo } from "@/hooks/useBondingCurveInfo";
import { useSwap } from "@/hooks/useSwap";
import { useDexStore } from "@/store/dexStore";
import { useDexLayoutStore, BlockId, BLOCK_META } from "@/store/dexLayoutStore";
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

  const volumeSol = trades.reduce((s, t) => s + t.amount_sol, 0);

  return (
    <div style={{ display: "flex", flexDirection: compact ? "column" : "row", background: "#0A0A0C" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
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

// ─── BLOCK 1: LIVE TOKENS ──────────────────────────────────────────────────

function LiveTokensBlock({
  tokens, isLoading, search, searchInput, setSearchInput, setSearch,
  newMints, onSelect, draggable = true,
}: {
  tokens: DexToken[]; isLoading: boolean; search: string;
  searchInput: string; setSearchInput: (v: string) => void; setSearch: (v: string) => void;
  newMints: Set<string>; onSelect: (t: DexToken) => void; draggable?: boolean;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const headerRight = (
    <div style={{ display: "flex", gap: 4 }}>
      <button
        onClick={() => setViewMode("grid")}
        title="Grid görünüm"
        style={{
          width: 22, height: 22, borderRadius: 6, cursor: "pointer",
          border: "1px solid rgba(212,175,122,0.18)",
          background: viewMode === "grid" ? "rgba(212,175,122,0.18)" : "transparent",
          color: viewMode === "grid" ? "#D4AF7A" : "rgba(212,175,122,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></svg>
      </button>
      <button
        onClick={() => setViewMode("list")}
        title="Liste görünüm"
        style={{
          width: 22, height: 22, borderRadius: 6, cursor: "pointer",
          border: "1px solid rgba(212,175,122,0.18)",
          background: viewMode === "list" ? "rgba(212,175,122,0.18)" : "transparent",
          color: viewMode === "list" ? "#D4AF7A" : "rgba(212,175,122,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
    </div>
  );

  return (
    <BlockShell id="live" headerRight={headerRight} draggable={draggable}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "8px 14px", margin: "0 12px 10px", marginTop: 12,
        borderRadius: 10,
        background: "rgba(212,175,122,0.06)",
        border: "1px solid rgba(212,175,122,0.14)",
      }}>
        <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#E8C989", animation: "netPing 1.6s ease-out infinite" }} />
          <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#E8C989", boxShadow: "0 0 6px #E8C989" }} />
        </span>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.08em", color: "#E8C989",
        }}>
          {tokens.length} TOKEN SU AN ISLEM GORUYOR
        </span>
      </div>
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,122,0.4)" strokeWidth={2.5} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="dex-input"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setSearch(e.target.value); }}
            placeholder="Search name, symbol, address..."
            style={{ height: 38, fontSize: 12, padding: "9px 12px 9px 34px" }}
          />
        </div>

        <div className="dex-scroll" style={{ maxHeight: 480, overflowY: "auto" }}>
          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(2, 1fr)" : "1fr", gap: 8 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: viewMode === "grid" ? 110 : 52, borderRadius: 12, animationDelay: `${i * 0.06}s` }} />
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <div style={{ padding: "40px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 26, opacity: 0.1, color: "#D4AF7A", marginBottom: 10 }}>◈</div>
              <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, margin: 0 }}>
                {search ? `No tokens matching "${search}"` : "No tokens yet"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {tokens.map((token, i) => (
                <div key={token.mint} style={{ animation: `fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 0.03, 0.3)}s both` }}>
                  <TokenCard token={token} isNew={newMints.has(token.mint)} onClick={() => onSelect(token)} />
                </div>
              ))}
            </div>
          ) : (
            tokens.map(token => (
              <TokenListRow key={token.mint} token={token} isNew={newMints.has(token.mint)} onClick={() => onSelect(token)} />
            ))
          )}
        </div>
      </div>
    </BlockShell>
  );
}

// ─── BLOCK 2: CREATE TOKEN (default kart, morph → trade ekranı) ────────────

function CreateTokenBlock({ selectedToken, onBack, draggable = true }: { selectedToken: DexToken | null; onBack: () => void; draggable?: boolean }) {
  if (selectedToken) {
    return (
      <BlockShell id="create" draggable={draggable}>
        <TokenTrade token={selectedToken} onBack={onBack} compact />
      </BlockShell>
    );
  }

  return (
    <BlockShell id="create" draggable={draggable}>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, marginBottom: 16,
          background: "linear-gradient(135deg, rgba(212,175,122,0.18), rgba(232,201,137,0.1))",
          border: "1px solid rgba(212,175,122,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, color: "#D4AF7A",
        }}>＋</div>
        <h3 style={{ margin: "0 0 8px", color: "#EDEBE6", fontSize: 15, fontWeight: 800 }}>Launch a Token</h3>
        <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.35)", fontSize: 12, maxWidth: 240, lineHeight: 1.6 }}>
          Name, symbol, supply ve bonding curve seçimini içeren tam launch formu ayrı sayfada.
        </p>
        <Link
          href="/create"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 12,
            background: "linear-gradient(135deg, #D4AF7A, #7b2ff7)",
            color: "#EDEBE6", fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12, fontWeight: 800, letterSpacing: "0.04em",
            textDecoration: "none", boxShadow: "0 4px 20px rgba(212,175,122,0.35)",
          }}
        >
          CREATE TOKEN →
        </Link>
        <p style={{ marginTop: 18, color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
          veya soldaki/sağdaki listeden bir token seçip anında trade et
        </p>
      </div>
    </BlockShell>
  );
}

// ─── BLOCK 3: TRENDING ─────────────────────────────────────────────────────

function TrendingBlock({ tokens, onSelect, draggable = true }: { tokens: DexToken[]; onSelect: (t: DexToken) => void; draggable?: boolean }) {
  // Not: gerçek hacim verisi ayrı bir hook'tan gelmiyorsa şimdilik en yeni tokenlara göre sıralanır.
  const trending = useMemo(() => {
    return [...tokens]
      .sort((a: any, b: any) => (b.volume24hSol ?? b.createdAt ?? 0) - (a.volume24hSol ?? a.createdAt ?? 0))
      .slice(0, 15);
  }, [tokens]);

  return (
    <BlockShell id="trending" draggable={draggable}>
      <div className="dex-scroll" style={{ padding: 10, maxHeight: 560, overflowY: "auto" }}>
        {trending.length === 0 ? (
          <div style={{ padding: "40px 10px", textAlign: "center", color: "rgba(255,255,255,0.22)", fontSize: 12 }}>
            No trending tokens yet
          </div>
        ) : (
          trending.map((token, i) => (
            <div
              key={token.mint}
              className="trend-row"
              onClick={() => onSelect(token)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 10, marginBottom: 4,
              }}
            >
              <span style={{ width: 16, fontSize: 10, color: "rgba(212,175,122,0.4)", fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <TokenAvatar token={token} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#EDEBE6", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{token.name}</span>
                  <span style={{ color: "#E8C989", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>${token.symbol}</span>
                </div>
              </div>

              {/* Hover'da chart preview */}
              <div className="trend-preview glass" style={{ overflow: "hidden" }}>
                <TradeChart mint={token.mint} trades={[]} />
              </div>
            </div>
          ))
        )}
      </div>
    </BlockShell>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

// --- MOBILE BLOCK CAROUSEL --------------------------------------------------
// Mobilde 3 blok yan yana sigmadigi icin tek seferde bir blok gosterilir.
// Ok butonlari veya parmakla kaydirarak (swipe) bloklar arasi gecis yapilir.

function MobileBlockCarousel({
  visibleOrder,
  blockContent,
  mobileIndex,
  setMobileIndex,
}: {
  visibleOrder: BlockId[];
  blockContent: Record<BlockId, React.ReactNode>;
  mobileIndex: number;
  setMobileIndex: (i: number) => void;
}) {
  const touchStartX = useRef<number | null>(null);
  const clampedIndex = Math.min(mobileIndex, Math.max(visibleOrder.length - 1, 0));
  const activeId = visibleOrder[clampedIndex];

  const goTo = (i: number) => {
    if (i < 0 || i >= visibleOrder.length) return;
    setMobileIndex(i);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 50;
    if (delta > SWIPE_THRESHOLD) goTo(clampedIndex - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(clampedIndex + 1);
    touchStartX.current = null;
  };

  if (visibleOrder.length === 0 || !activeId) return null;

  return (
    <div>
      {/* Ust navigasyon: geri / ileri + nokta gostergesi */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button
          onClick={() => goTo(clampedIndex - 1)}
          disabled={clampedIndex === 0}
          aria-label="Onceki blok"
          style={{
            width: 34, height: 34, borderRadius: 10,
            border: "1px solid rgba(212,175,122,0.22)",
            background: "rgba(212,175,122,0.06)",
            color: clampedIndex === 0 ? "rgba(212,175,122,0.25)" : "#D4AF7A",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: clampedIndex === 0 ? "default" : "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {visibleOrder.map((id, i) => (
            <button
              key={id}
              onClick={() => goTo(i)}
              aria-label={`${BLOCK_META[id].title} bloguna git`}
              style={{
                width: i === clampedIndex ? 20 : 7, height: 7, borderRadius: 4,
                border: "none", cursor: "pointer", padding: 0,
                background: i === clampedIndex ? "#D4AF7A" : "rgba(212,175,122,0.25)",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(clampedIndex + 1)}
          disabled={clampedIndex === visibleOrder.length - 1}
          aria-label="Sonraki blok"
          style={{
            width: 34, height: 34, borderRadius: 10,
            border: "1px solid rgba(212,175,122,0.22)",
            background: "rgba(212,175,122,0.06)",
            color: clampedIndex === visibleOrder.length - 1 ? "rgba(212,175,122,0.25)" : "#D4AF7A",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: clampedIndex === visibleOrder.length - 1 ? "default" : "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Aktif blok, swipe destekli */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ display: "flex" }}>
        <div key={activeId} style={{ width: "100%", animation: "fadeUp 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
          {blockContent[activeId]}
        </div>
      </div>
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

export default function DexPageContent() {
  const searchParams  = useSearchParams();
  const mintFromUrl   = searchParams.get("mint");
  const [searchInput, setSearchInput] = useState("");
  const [newMints, setNewMints]       = useState<Set<string>>(new Set());
  const prevMintsRef                  = useRef<Set<string>>(new Set());

  const { search, selectedMint, setSearch, selectToken, resetTrade } = useDexStore();
  const { tokens, isLoading }                                          = useDexTokens();

  const { order, closed, setOrder, mobileIndex, setMobileIndex } = useDexLayoutStore();

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

  const handleSelect = (token: DexToken) => {
    selectToken(token.mint, token.genesisAccount ?? null);
    resetTrade();
  };
  const handleBack = () => {
    selectToken("", null);
    resetTrade();
  };

  const closedIds = (Object.keys(closed) as BlockId[]).filter(id => closed[id]);
  const visibleOrder = order.filter(id => !closed[id]);

  const desktopBlockContent: Record<BlockId, React.ReactNode> = {
    live: (
      <LiveTokensBlock
        tokens={filteredTokens}
        isLoading={isLoading}
        search={search}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setSearch={setSearch}
        newMints={newMints}
        onSelect={handleSelect}
        draggable
      />
    ),
    create: <CreateTokenBlock selectedToken={selectedToken} onBack={handleBack} draggable />,
    trending: <TrendingBlock tokens={tokens} onSelect={handleSelect} draggable />,
  };

  const mobileBlockContent: Record<BlockId, React.ReactNode> = {
    live: (
      <LiveTokensBlock
        tokens={filteredTokens}
        isLoading={isLoading}
        search={search}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setSearch={setSearch}
        newMints={newMints}
        onSelect={handleSelect}
        draggable={false}
      />
    ),
    create: <CreateTokenBlock selectedToken={selectedToken} onBack={handleBack} draggable={false} />,
    trending: <TrendingBlock tokens={tokens} onSelect={handleSelect} draggable={false} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0C", color: "#EDEBE6", fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>
      <Background />
      <div className="grain-overlay" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Ust bar: solda parlayan Axor.fun logosu, sagda cuzdan baglama butonu */}
        <div style={{ padding: "20px 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div
            className="glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
            }}
          >
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

          {/* Kapatılmış blok çipleri */}
          {closedIds.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {closedIds.map(id => <ClosedBlockChip key={id} id={id} />)}
            </div>
          )}

          {/* 3 blok — masaustu: surukle-birak yan yana */}
          <div className="dex-blocks-desktop">
            <Reorder.Group
              as="div"
              axis="x"
              values={visibleOrder}
              onReorder={(newVisible) => {
                // gizli (closed) blokların sırasını koru, sadece görünenleri güncelle
                const merged = [...newVisible, ...order.filter(id => closed[id])];
                setOrder(merged as BlockId[]);
              }}
              className="dex-blocks"
              style={{ display: "flex", gap: 16, alignItems: "flex-start", listStyle: "none", padding: 0, margin: 0 }}
            >
              {visibleOrder.map(id => (
                <div key={id} style={{ display: "contents" }}>
                  {desktopBlockContent[id]}
                </div>
              ))}
            </Reorder.Group>
          </div>

          {/* 3 blok — mobil: tek blok + ok/swipe ile gecis */}
          <div className="dex-blocks-mobile">
            <MobileBlockCarousel
              visibleOrder={visibleOrder}
              blockContent={mobileBlockContent}
              mobileIndex={mobileIndex}
              setMobileIndex={setMobileIndex}
            />
          </div>

        </div>
      </div>
    </div>
  );
}