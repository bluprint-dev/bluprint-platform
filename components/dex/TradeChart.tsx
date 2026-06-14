"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Trade } from "@/hooks/useTrades";

type OHLCCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Props = {
  mint: string;
  trades: Trade[];
};

function tradesToCandles(trades: Trade[], intervalMs = 5 * 60 * 1000): OHLCCandle[] {
  if (trades.length === 0) return [];
  const sorted = [...trades].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const buckets = new Map<number, { prices: number[]; volume: number }>();
  for (const t of sorted) {
    const ts = new Date(t.created_at).getTime();
    const bucket = Math.floor(ts / intervalMs) * intervalMs;
    if (!buckets.has(bucket)) buckets.set(bucket, { prices: [], volume: 0 });
    if (t.price > 0) {
      buckets.get(bucket)!.prices.push(t.price);
      buckets.get(bucket)!.volume += t.amount_sol;
    }
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .filter(([, { prices }]) => prices.length > 0)
    .map(([ts, { prices, volume }]) => ({
      time: Math.floor(ts / 1000),
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume,
    }));
}

export default function TradeChart({ mint, trades }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volSeriesRef = useRef<any>(null);
  const initRef = useRef(false);

  const renderCandles = useCallback(() => {
    if (!candleSeriesRef.current || !volSeriesRef.current) return;
    const candles = tradesToCandles(trades);
    if (candles.length === 0) return;

    candleSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    volSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(20,241,149,0.35)" : "rgba(255,45,149,0.35)",
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [trades]);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    import("lightweight-charts").then((lc) => {
      if (!containerRef.current) return;

      // v4 compat: CrosshairMode may be an enum or object
      const CrosshairMode = (lc as any).CrosshairMode ?? { Normal: 1 };

      const chart = lc.createChart(containerRef.current, {
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
        layout: {
          background: { color: "transparent" } as any,
          textColor: "rgba(255,255,255,0.5)",
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "rgba(153,69,255,0.06)" },
          horzLines: { color: "rgba(153,69,255,0.06)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(153,69,255,0.5)", labelBackgroundColor: "#1a0a2e" },
          horzLine: { color: "rgba(153,69,255,0.5)", labelBackgroundColor: "#1a0a2e" },
        },
        rightPriceScale: {
          borderColor: "rgba(153,69,255,0.1)",
          scaleMargins: { top: 0.1, bottom: 0.25 },
        },
        timeScale: {
          borderColor: "rgba(153,69,255,0.1)",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // ── v5 API: addSeries(SeriesType) ─────────────────────────────
      // v4 API: chart.addCandlestickSeries() / chart.addHistogramSeries()
      // We support both by checking which API is available.
      let candleSeries: any;
      let volSeries: any;

      if (typeof (chart as any).addCandlestickSeries === "function") {
        // lightweight-charts v4
        candleSeries = (chart as any).addCandlestickSeries({
          upColor: "#14F195",
          downColor: "#ff2d95",
          borderUpColor: "#14F195",
          borderDownColor: "#ff2d95",
          wickUpColor: "rgba(20,241,149,0.6)",
          wickDownColor: "rgba(255,45,149,0.6)",
        });
        volSeries = (chart as any).addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
      } else {
        // lightweight-charts v5
        const { CandlestickSeries, HistogramSeries } = lc as any;
        candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#14F195",
          downColor: "#ff2d95",
          borderUpColor: "#14F195",
          borderDownColor: "#ff2d95",
          wickUpColor: "rgba(20,241,149,0.6)",
          wickDownColor: "rgba(255,45,149,0.6)",
        });
        volSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
      }

      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volSeriesRef.current = volSeries;

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      });
      ro.observe(containerRef.current);

      renderCandles();
    });

    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volSeriesRef.current = null;
      initRef.current = false;
    };
  }, []);

  useEffect(() => {
    renderCandles();
  }, [renderCandles]);

  const candles = tradesToCandles(trades);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 320 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {candles.length === 0 && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          pointerEvents: "none",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(153,69,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>📊</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              WAITING FOR TRADES
            </div>
            <div style={{ color: "rgba(153,69,255,0.4)", fontFamily: "monospace", fontSize: 10 }}>
              Chart updates live as swaps happen
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, opacity: 0.12, marginTop: 8 }}>
            {[30,45,25,60,40,70,35,55,42,65,50,38,72,48,58].map((h, i) => (
              <div key={i} style={{
                width: 8, height: h, borderRadius: 2,
                background: i % 2 === 0 ? "#14F195" : "#9945FF",
                animation: `skeletonPulse ${1 + (i * 0.1)}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes skeletonPulse {
          from { opacity: 0.3; }
          to { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}