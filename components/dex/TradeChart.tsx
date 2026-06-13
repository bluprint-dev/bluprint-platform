"use client";

import { useEffect, useRef } from "react";
import type { Trade } from "@/hooks/useTrades";

type Props = {
  trades: Trade[];
  symbol: string;
};

function buildCandles(trades: Trade[]) {
  if (trades.length === 0) return [];

  const sorted = [...trades].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // 5 dakikalık mumlar
  const PERIOD = 5 * 60 * 1000;

  const buckets: Record<number, number[]> = {};
  for (const t of sorted) {
    const ts = new Date(t.created_at).getTime();
    const bucket = Math.floor(ts / PERIOD) * PERIOD;
    if (!buckets[bucket]) buckets[bucket] = [];
    buckets[bucket].push(t.price);
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([ts, prices]) => ({
      time: Math.floor(Number(ts) / 1000) as any,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
    }));
}

export default function TradeChart({ trades, symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let chart: any;

    import("lightweight-charts").then(({ createChart, ColorType, CrosshairMode }) => {
      if (!containerRef.current) return;

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "rgba(255,255,255,0.4)",
        },
        grid: {
          vertLines: { color: "rgba(153,69,255,0.06)" },
          horzLines: { color: "rgba(153,69,255,0.06)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(153,69,255,0.4)", labelBackgroundColor: "#9945FF" },
          horzLine: { color: "rgba(153,69,255,0.4)", labelBackgroundColor: "#9945FF" },
        },
        rightPriceScale: {
          borderColor: "rgba(153,69,255,0.15)",
          textColor: "rgba(255,255,255,0.3)",
        },
        timeScale: {
          borderColor: "rgba(153,69,255,0.15)",
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      const series = chart.addCandlestickSeries({
        upColor: "#14F195",
        downColor: "#ff2d95",
        borderUpColor: "#14F195",
        borderDownColor: "#ff2d95",
        wickUpColor: "#14F195",
        wickDownColor: "#ff2d95",
      });

      chartRef.current = chart;
      seriesRef.current = series;

      const candles = buildCandles(trades);
      if (candles.length > 0) {
        series.setData(candles);
        chart.timeScale().fitContent();
      }

      // Responsive resize
      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      });
      ro.observe(containerRef.current);

      return () => ro.disconnect();
    });

    return () => {
      chart?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Trades değişince güncelle
  useEffect(() => {
    if (!seriesRef.current || trades.length === 0) return;
    const candles = buildCandles(trades);
    if (candles.length > 0) {
      seriesRef.current.setData(candles);
      chartRef.current?.timeScale().fitContent();
    }
  }, [trades]);

  if (trades.length < 2) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
        <p style={{ color: "rgba(153,69,255,0.35)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em" }}>
          AWAITING_TRADES...
        </p>
        <p style={{ color: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: 9 }}>
          {trades.length}/2 trades
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
  );
}