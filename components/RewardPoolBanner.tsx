"use client";

import { useEffect, useState } from "react";

interface Props {
  gameId?: string;
  day?: string;
}

export default function RewardPoolBanner({ gameId = "axor_runner", day }: Props) {
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const d = day ?? new Date().toISOString().slice(0, 10);
    fetch(`/api/games/pool?gameId=${gameId}&day=${d}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) setAmount(data.pool?.total_amount ?? 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, day]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(212,175,122,0.14), rgba(232,201,137,0.05))",
        border: "1px solid rgba(212,175,122,0.28)",
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 28 }}>🏆</div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "rgba(212,175,122,0.75)",
          }}
        >
          TODAY&apos;S REWARD POOL
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 20,
            fontWeight: 900,
            color: "#F2E4C2",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {loading ? "..." : `${(amount ?? 0).toLocaleString("en-US", { maximumFractionDigits: 3 })} SOL`}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(242,228,194,0.5)" }}>
          The top-scoring wallet gets a share of the bonding curve proportional to their score.
        </p>
      </div>
    </div>
  );
}