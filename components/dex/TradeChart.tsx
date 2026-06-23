"use client";

import { useState } from "react";

type Props = {
  mint: string;
  trades?: any[];
};

const INTERVALS = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1H", value: "1H" },
  { label: "4H", value: "4H" },
  { label: "1D", value: "1D" },
] as const;

export default function TradeChart({ mint }: Props) {
  const [interval, setInterval] = useState("5m");
  const [iframeError, setIframeError] = useState(false);

  const src = `https://embed.birdeye.so/tv-widget/${mint}?chain=solana&viewMode=pair&chartInterval=${interval}&chartType=CANDLE&chartTimezone=Etc%2FUTC&chartLeftToolbar=hide&theme=dark`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 320 }}>
      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, display: "flex", gap: 4 }}>
        {INTERVALS.map((iv) => (
          <button
            key={iv.value}
            onClick={() => setInterval(iv.value)}
            style={{
              padding: "3px 10px", borderRadius: 3, border: "none", cursor: "pointer",
              fontFamily: "'Trebuchet MS', Roboto, sans-serif", fontSize: 12, fontWeight: 500,
              background: interval === iv.value ? "#2a2e39" : "transparent",
              color: interval === iv.value ? "#d1d4dc" : "#787b86",
              transition: "all 0.15s",
            }}
          >
            {iv.label}
          </button>
        ))}
      </div>

      {!iframeError ? (
        <iframe
          key={src}
          src={src}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          style={{ border: "none", display: "block" }}
          title="Token Chart"
          onError={() => setIframeError(true)}
        />
      ) : (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
              CHART UNAVAILABLE
            </div>
            <div style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 10, marginTop: 4 }}>
              Token may not be indexed yet
            </div>
          </div>
        </div>
      )}
    </div>
  );
}