"use client";

import { memo, useEffect, useState } from "react";
import type { DexToken } from "@/types/dex";
import { shortMint } from "@/lib/dex/normalizeToken";

type TokenCardProps = {
  token: DexToken;
  selected?: boolean;
  index?: number;
  onSelect: (token: DexToken) => void;
};

function TokenAvatar({ token }: { token: DexToken }) {
  if (token.imageUrl) {
    return (
      <img src={token.imageUrl} alt={token.symbol} style={{
        width: 42, height: 42, borderRadius: "50%", objectFit: "cover",
        border: "1.5px solid rgba(153,69,255,0.25)",
        flexShrink: 0,
      }} loading="lazy" />
    );
  }
  const colors = ["#9945FF,#14F195", "#ff2d95,#9945FF", "#14F195,#0fa96a", "#ff6bcb,#ff2d95"];
  const grad = colors[(token.symbol.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{
      width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${grad})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 17, fontWeight: 900, color: "#fff",
      border: "1.5px solid rgba(153,69,255,0.2)",
    }}>
      {token.symbol.charAt(0)}
    </div>
  );
}

// ─── DEV HOLDING BADGE ──────────────────────────────────
function DevHoldingBadge({ token }: { token: DexToken }) {
  const [percent, setPercent] = useState<number | null>(null);

  const creatorWallet = token.creator || token.genesisAccount || "";

  useEffect(() => {
    if (!creatorWallet || !token.mint) return;
    let cancelled = false;

    fetch(`/api/dev-holding?mint=${encodeURIComponent(token.mint)}&creator=${encodeURIComponent(creatorWallet)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.success) {
          setPercent(data.devPercent);
        }
      })
      .catch(() => {
        if (!cancelled) setPercent(null);
      });

    return () => { cancelled = true; };
  }, [creatorWallet, token.mint]);

  if (percent === null) return null;

  const color =
    percent < 5 ? "#14F195" :
    percent < 15 ? "#facc15" :
    "#ff4d4d";

  const bg =
    percent < 5 ? "rgba(20,241,149,0.1)" :
    percent < 15 ? "rgba(250,204,21,0.1)" :
    "rgba(255,77,77,0.1)";

  return (
    <span
      title="Dev wallet holding percentage"
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        color, background: bg,
        fontFamily: "monospace", fontSize: 9.5, fontWeight: 700,
        padding: "1px 5px", borderRadius: 4,
        flexShrink: 0,
      }}
    >
      Dev {percent}%
    </span>
  );
}

function TokenCardComponent({ token, selected, index = 0, onSelect }: TokenCardProps) {
  const age = token.createdAt
    ? Math.floor((Date.now() - token.createdAt) / 60000)
    : null;
  const ageText = age === null ? "" : age < 60 ? `${age}m` : `${Math.floor(age / 60)}h`;

  return (
    <button
      type="button"
      onClick={() => onSelect(token)}
      style={{
        width: "100%", textAlign: "left",
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        border: selected
          ? "1px solid rgba(153,69,255,0.5)"
          : "1px solid rgba(255,255,255,0.04)",
        background: selected
          ? "linear-gradient(135deg, rgba(153,69,255,0.12), rgba(20,241,149,0.04))"
          : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: selected ? "0 0 20px rgba(153,69,255,0.12)" : "none",
        animationDelay: `${Math.min(index * 20, 300)}ms`,
      }}
      onMouseEnter={e => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(153,69,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(153,69,255,0.25)";
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.04)";
        }
      }}
    >
      {/* Avatar */}
      <TokenAvatar token={token} />

      {/* Name + mint */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
          <span style={{
            color: "#fff", fontWeight: 700, fontSize: 14,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{token.name}</span>
          <span style={{
            color: selected ? "#14F195" : "rgba(153,69,255,0.7)",
            fontFamily: "monospace", fontSize: 11, fontWeight: 700,
            background: selected ? "rgba(20,241,149,0.08)" : "rgba(153,69,255,0.08)",
            padding: "1px 6px", borderRadius: 4,
            flexShrink: 0,
          }}>${token.symbol}</span>
          <DevHoldingBadge token={token} />
        </div>
        <span style={{
          color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 10,
        }}>
          {shortMint(token.mint)}
        </span>
      </div>

      {/* Age + arrow */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        {ageText && (
          <span style={{
            color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 10,
          }}>{ageText} ago</span>
        )}
        <span style={{
          color: selected ? "#14F195" : "rgba(153,69,255,0.4)",
          fontSize: 14, fontWeight: 700,
          transition: "color 0.15s",
        }}>›</span>
      </div>
    </button>
  );
}

export default memo(TokenCardComponent);