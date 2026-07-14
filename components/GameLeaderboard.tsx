"use client";

import { useEffect, useState, useCallback } from "react";

interface Entry {
  wallet: string;
  best_score: number;
  reward_amount: number | null;
  tx_signature: string | null;
  paid_at: string | null;
}

interface Props {
  gameId?: string;
  day?: string;
  refreshKey?: number;
}

function shortenAddress(a: string) {
  return `${a.slice(0, 4)}...${a.slice(-4)}`;
}

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function GameLeaderboard({ gameId = "axor_runner", day, refreshKey }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const d = day ?? new Date().toISOString().slice(0, 10);
    setLoading(true);
    fetch(`/api/games/leaderboard?gameId=${gameId}&day=${d}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEntries(data.leaderboard ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId, day]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openSolscan = (wallet: string) => {
    window.open(`https://solscan.io/account/${wallet}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h2
        style={{
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: 18,
          fontWeight: 800,
          color: "#F2E4C2",
          margin: "0 0 14px",
        }}
      >
        Günün Liderlik Tablosu
      </h2>

      {loading && entries.length === 0 && (
        <p style={{ color: "rgba(242,228,194,0.4)", fontSize: 13 }}>Yükleniyor...</p>
      )}

      {!loading && entries.length === 0 && (
        <p style={{ color: "rgba(242,228,194,0.4)", fontSize: 13 }}>
          Bugün henüz skor kaydedilmedi. İlk sen ol.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e, i) => {
          const isTop3 = i < 3;
          return (
            <div
              key={e.wallet}
              onClick={() => openSolscan(e.wallet)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: isTop3 ? "14px 18px" : "10px 16px",
                borderRadius: 14,
                cursor: "pointer",
                background: isTop3
                  ? `linear-gradient(135deg, ${MEDAL_COLORS[i]}22, rgba(20,18,24,0.5))`
                  : "rgba(255,255,255,0.02)",
                border: isTop3 ? `1px solid ${MEDAL_COLORS[i]}55` : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isTop3 ? `0 4px 18px ${MEDAL_COLORS[i]}22` : "none",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(ev) => (ev.currentTarget.style.transform = "translateX(3px)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.transform = "translateX(0)")}
            >
              <div
                style={{
                  width: isTop3 ? 34 : 26,
                  textAlign: "center",
                  fontSize: isTop3 ? 22 : 13,
                  fontWeight: 800,
                  color: isTop3 ? MEDAL_COLORS[i] : "rgba(242,228,194,0.4)",
                  fontFamily: "var(--font-mono), monospace",
                  flexShrink: 0,
                }}
              >
                {isTop3 ? MEDALS[i] : i + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: isTop3 ? 14 : 13,
                    fontWeight: isTop3 ? 800 : 500,
                    color: isTop3 ? "#F2E4C2" : "rgba(242,228,194,0.7)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {shortenAddress(e.wallet)}
                </p>
                {e.paid_at && (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#4ADE80" }}>Ödül gönderildi</p>
                )}
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: isTop3 ? 18 : 14,
                  fontWeight: 800,
                  color: isTop3 ? MEDAL_COLORS[i] : "#D4AF7A",
                }}
              >
                {e.best_score.toLocaleString("en-US")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}