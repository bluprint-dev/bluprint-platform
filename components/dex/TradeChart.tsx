"use client";

import { useState } from "react";

type Props = {
  mint: string;
  trades?: any[];
};

export default function TradeChart({ mint }: Props) {
  const [iframeError, setIframeError] = useState(false);

  const src = `https://embed.birdeye.so/tv-widget/${mint}?chain=solana&viewMode=pair&chartInterval=5m&chartType=CANDLE&chartTimezone=Etc%2FUTC&chartLeftToolbar=hide&theme=dark`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 320 }}>
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