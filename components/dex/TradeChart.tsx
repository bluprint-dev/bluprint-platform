"use client";

import { useEffect, useRef, useState } from "react";
import type { Trade } from "@/hooks/useTrades";

type Props = {
  mint: string;
  trades: Trade[];
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

const INTERVAL_MS: Record<Interval, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1H": 60 * 60_000,
  "4H": 4 * 60 * 60_000,
  "1D": 24 * 60 * 60_000,
};

function tradesToCandles(trades: Trade[], intervalMs: number): Candle[] {
  const valid = trades.filter((t) => t.price > 0);
  if (valid.length === 0) return [];

  const sorted = [...valid].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const buckets = new Map<number, { prices: number[]; volume: number }>();
  for (const t of sorted) {
    const ts = new Date(t.created_at).getTime();
    const bucket = Math.floor(ts / intervalMs) * intervalMs;
    if (!buckets.has(bucket)) buckets.set(bucket, { prices: [], volume: 0 });
    buckets.get(bucket)!.prices.push(t.price);
    buckets.get(bucket)!.volume += t.amount_sol;
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
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
  const [interval, setInterval] = useState<Interval>("5m");
  const [ready, setReady] = useState(false);

  // Chart'ı bir kez kur
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
          background: { color: "#131722" } as any,
          textColor: "#b2b5be",
          fontFamily: "'Trebuchet MS', Roboto, sans-serif",
          fontSize: 12,
        },
        grid: {
          vertLines: { color: "#1e222d" },
          horzLines: { color: "#1e222d" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "#758696", labelBackgroundColor: "#2a2e39", style: 3 },
          horzLine: { color: "#758696", labelBackgroundColor: "#2a2e39", style: 3 },
        },
        rightPriceScale: {
          borderColor: "#2a2e39",
          scaleMargins: { top: 0.15, bottom: 0.3 },
        },
        timeScale: {
          borderColor: "#2a2e39",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      let candleSeries: any;
      let volSeries: any;

      if (typeof (chart as any).addCandlestickSeries === "function") {
        candleSeries = (chart as any).addCandlestickSeries({
          upColor: "#26a69a", downColor: "#ef5350",
          borderUpColor: "#26a69a", borderDownColor: "#ef5350",
          wickUpColor: "#26a69a", wickDownColor: "#ef5350",
          priceFormat: {
            type: "price",
            precision: 10,
            minMove: 0.0000000001,
          },
        });
        volSeries = (chart as any).addHistogramSeries({
          priceFormat: { type: "volume" }, priceScaleId: "vol",
        });
      } else {
        const { CandlestickSeries, HistogramSeries } = lc as any;
        candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#26a69a", downColor: "#ef5350",
          borderUpColor: "#26a69a", borderDownColor: "#ef5350",
          wickUpColor: "#26a69a", wickDownColor: "#ef5350",
          priceFormat: {
            type: "price",
            precision: 10,
            minMove: 0.0000000001,
          },
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

      setReady(true);
    });

    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volSeriesRef.current = null;
      initRef.current = false;
    };
  }, []);

  // trades veya interval değişince candle'ları yeniden çiz
  useEffect(() => {
    if (!ready || !candleSeriesRef.current || !volSeriesRef.current) return;

    const candles = tradesToCandles(trades, INTERVAL_MS[interval]);
    if (candles.length === 0) return;

    candleSeriesRef.current.setData(
      candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
    );
    volSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(38,166,154,0.5)" : "rgba(239,83,80,0.5)",
      }))
    );
    const chart = chartRef.current;
    if (chart) {
      const timeScale = chart.timeScale();
      // Mum başlarına sıkışmasın, sağda biraz boşluk bıraksın (Birdeye tarzı)
      const rightOffsetBars = Math.max(5, Math.floor(candles.length * 0.5));
      timeScale.applyOptions({ rightOffset: rightOffsetBars });

      // Az mum varsa çok fazla yakınlaşmasın — minimum bir zaman aralığı zorla
      const intervalMs = INTERVAL_MS[interval];
      const minBars = 20; // ekranda en az ~20 bar genişliğinde alan göster
      const minRangeSec = (minBars * intervalMs) / 1000;

      const lastTime = candles[candles.length - 1].time;
      const firstTime = candles[0].time;
      const currentRangeSec = lastTime - firstTime;

      if (currentRangeSec < minRangeSec) {
        const extra = (minRangeSec - currentRangeSec) / 2;
        timeScale.setVisibleRange({
          from: firstTime - extra,
          to: lastTime + extra + (intervalMs / 1000) * rightOffsetBars,
        });
      } else {
        timeScale.fitContent();
      }

      // --- Y EKSENİ (fiyat) AKILLI AUTOSCALE ---
      // Az mum varken tek bir candle'ın high-low'u tüm grafiği domine edebiliyor.
      // Bunu engellemek için: mevcut tüm candle'ların fiyat aralığını hesapla,
      // ve görünür aralığa makul bir "nefes alanı" (padding) ekleyip autoscale'i kapat,
      // manuel bir min/max ata. Yeterince mum oluştuğunda (>= minBars) tekrar
      // otomatik moda bırak çünkü o noktada dağılım zaten doğal genişler.
      const priceScale = chart.priceScale("right");
      if (candles.length < minBars) {
        const highs = candles.map((c) => c.high);
        const lows = candles.map((c) => c.low);
        const maxPrice = Math.max(...highs);
        const minPrice = Math.min(...lows);
        const range = maxPrice - minPrice;
        // Aralık 0 ise (tek fiyat) %20 yapay genişlik ver, yoksa %35 padding ekle
        const padding = range === 0 ? maxPrice * 0.2 || 0.0000001 : range * 0.35;

        priceScale.applyOptions({
          autoScale: false,
        });
        candleSeriesRef.current.applyOptions({
          autoscaleInfoProvider: () => ({
            priceRange: {
              minValue: Math.max(0, minPrice - padding),
              maxValue: maxPrice + padding,
            },
          }),
        });
      } else {
        priceScale.applyOptions({ autoScale: true });
        candleSeriesRef.current.applyOptions({
          autoscaleInfoProvider: undefined,
        });
      }
    }
  }, [trades, interval, ready]);

  const hasData = trades.some((t) => t.price > 0);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 320 }}>
      {/* Interval buttons */}
      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, display: "flex", gap: 4 }}>
        {INTERVALS.map((iv) => (
          <button
            key={iv}
            onClick={() => setInterval(iv)}
            style={{
              padding: "3px 10px", borderRadius: 3, border: "none", cursor: "pointer",
              fontFamily: "'Trebuchet MS', Roboto, sans-serif", fontSize: 12, fontWeight: 500,
              background: interval === iv ? "#2a2e39" : "transparent",
              color: interval === iv ? "#d1d4dc" : "#787b86",
              transition: "all 0.15s",
            }}
          >
            {iv}
          </button>
        ))}
      </div>

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {!ready && (
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

      {ready && !hasData && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 28, opacity: 0.3 }}>â—ˆ</div>
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
    </div>
  );
}