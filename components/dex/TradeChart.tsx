"use client";

type Props = {
  symbol: string;
  mint: string;
};

export default function TradeChart({ symbol, mint }: Props) {
  if (!mint) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
        <p style={{ color: "rgba(153,69,255,0.35)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em" }}>
          SELECT_TOKEN
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={`https://birdeye.so/tv-widget/${mint}?chain=solana&viewMode=pair&chartInterval=15&chartType=Candle&chartTimezone=UTC&chartLeftToolbar=show&theme=dark`}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
        minHeight: 200,
      }}
      allow="clipboard-write"
      allowFullScreen
    />
  );
}