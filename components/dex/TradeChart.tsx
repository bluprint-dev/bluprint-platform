"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  mint: string;
};

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const INTERVALS = ["1m", "5m", "15m", "1H", "4H", "1D"] as const;
type Interval = typeof INTERVALS[number];

export default function TradeChart({ mint }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volSeriesRef = useRef<any>(null);
  const initRef = useRef(false);
  const [interval, setInterval] = useState<Interval>("5m");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAndRender = useCallback(async (iv: Interval) => {
    if (!candleSeriesRef.current || !volSeriesRef.current) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/birdeye/ohlcv?mint=${mint}&type=${iv}`);
      const data = await res.json();
      const items: Candle[] = (data?.data?.items ?? []).map((c: any) => ({
        time: c.unixTime,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
        volume: c.v,
      }));

      if (items.length === 0) { setError(true); setLoading(false); return; }

      candleSeriesRef.current.setData(items.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })));
      volSeriesRef.current.setData(items.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(20,241,149,0.35)" : "rgba(255,45,149,0.35)",
      })));
      chartRef.current?.timeScale().fitContent();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    import("lightweight-charts").then((lc) => {
      if (!containerRef.current) return;
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

      let candleSeries: any;
      let volSeries: any;

      if (typeof (chart as any).addCandlestickSeries === "function") {
        candleSeries = (chart as any).addCandlestickSeries({
          upColor: "#14F195", downColor: "#ff2d95",
          borderUpColor: "#14F195", borderDownColor: "#ff2d95",
          wickUpColor: "rgba(20,241,149,0.6)", wickDownColor: "rgba(255,45,149,0.6)",
        });
        volSeries = (chart as any).addHistogramSeries({
          priceFormat: { type: "volume" }, priceScaleId: "vol",
        });
      } else {
        const { CandlestickSeries, HistogramSeries } = lc as any;
        candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#14F195", downColor: "#ff2d95",
          borderUpColor: "#14F195", borderDownColor: "#ff2d95",
          wickUpColor: "rgba(20,241,149,0.6)", wickDownColor: "rgba(255,45,149,0.6)",
        });
        volSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" }, priceScaleId: "vol",
        });
      }

      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volSeriesRef.current = volSeries;

      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      });
      ro.observe(containerRef.current);

      fetchAndRender("5m");
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
    fetchAndRender(interval);
    const iv = globalThis.setInterval(() => fetchAndRender(interval), 30_000);
    return () => globalThis.clearInterval(iv);
  }, [interval, fetchAndRender]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 320 }}>
      {/* Interval buttons */}
      <div style={{
        position: "absolute", top: 8, left: 8, zIndex: 10,
        display: "flex", gap: 4,
      }}>
        {INTERVALS.map(iv => (
          <button key={iv} onClick={() => setInterval(iv)} style={{
            padding: "3px 8px", borderRadius: 5, border: "none", cursor: "pointer",
            fontFamily: "monospace", fontSize: 10, fontWeight: 700,
            background: interval === iv ? "rgba(153,69,255,0.4)" : "rgba(153,69,255,0.08)",
            color: interval === iv ? "#fff" : "rgba(255,255,255,0.35)",
            transition: "all 0.15s",
          }}>{iv}</button>
        ))}
      </div>

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "rgba(7,7,15,0.6)", pointerEvents: "none",
        }}>
          <span style={{ color: "rgba(153,69,255,0.5)", fontFamily: "monospace", fontSize: 11 }}>
            Loading chart...
          </span>
        </div>
      )}

      {!loading && error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 28 }}>📊</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
              WAITING FOR TRADES
            </div>
            <div style={{ color: "rgba(153,69,255,0.3)", fontFamily: "monospace", fontSize: 10, marginTop: 4 }}>
              Chart appears once trading begins
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes skeletonPulse {
          from { opacity: 0.3; } to { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}