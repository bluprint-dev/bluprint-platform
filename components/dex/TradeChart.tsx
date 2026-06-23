"use client";

import { useEffect, useRef, useState } from "react";
import type { Trade } from "@/hooks/useTrades";

type Props = {
  mint: string;
  trades: Trade[];
};

type PricePoint = {
  time: number;
  value: number;
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

// Trade'leri zaman bucket'larına göre tek bir fiyat noktasına indir (bucket'taki son fiyat + toplam hacim).
// Candlestick'in high/low/wick karmaşası yok — bu yüzden az veri varken bozulmuyor.
function tradesToPoints(trades: Trade[], intervalMs: number): PricePoint[] {
  const valid = trades.filter((t) => t.price > 0);
  if (valid.length === 0) return [];

  const sorted = [...valid].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const buckets = new Map<number, { lastPrice: number; volume: number }>();
  for (const t of sorted) {
    const ts = new Date(t.created_at).getTime();
    const bucket = Math.floor(ts / intervalMs) * intervalMs;
    const existing = buckets.get(bucket);
    if (existing) {
      existing.lastPrice = t.price; // bucket içindeki en son fiyat kazanır
      existing.volume += t.amount_sol;
    } else {
      buckets.set(bucket, { lastPrice: t.price, volume: t.amount_sol });
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, { lastPrice, volume }]) => ({
      time: Math.floor(ts / 1000),
      value: lastPrice,
      volume,
    }));
}

export default function TradeChart({ mint, trades }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const areaSeriesRef = useRef<any>(null);
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

      let areaSeries: any;
      let volSeries: any;

      // Area series — fiyatı dolgu ile gösterir (Birdeye/Pump.fun tarzı)
      if (typeof (chart as any).addAreaSeries === "function") {
        areaSeries = (chart as any).addAreaSeries({
          lineColor: "#26a69a",
          topColor: "rgba(38,166,154,0.35)",
          bottomColor: "rgba(38,166,154,0.02)",
          lineWidth: 2,
          priceFormat: { type: "price", precision: 10, minMove: 0.0000000001 },
        });
        volSeries = (chart as any).addHistogramSeries({
          priceFormat: { type: "volume" }, priceScaleId: "vol",
          color: "rgba(38,166,154,0.4)",
        });
      } else {
        const { AreaSeries, HistogramSeries } = lc as any;
        areaSeries = chart.addSeries(AreaSeries, {
          lineColor: "#26a69a",
          topColor: "rgba(38,166,154,0.35)",
          bottomColor: "rgba(38,166,154,0.02)",
          lineWidth: 2,
          priceFormat: { type: "price", precision: 10, minMove: 0.0000000001 },
        });
        volSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" }, priceScaleId: "vol",
          color: "rgba(38,166,154,0.4)",
        });
      }

      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      chartRef.current = chart;
      areaSeriesRef.current = areaSeries;
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
      areaSeriesRef.current = null;
      volSeriesRef.current = null;
      initRef.current = false;
    };
  }, []);

  // trades veya interval değişince noktaları yeniden çiz
  useEffect(() => {
    if (!ready || !areaSeriesRef.current || !volSeriesRef.current) return;

    const points = tradesToPoints(trades, INTERVAL_MS[interval]);
    if (points.length === 0) return;

    areaSeriesRef.current.setData(
      points.map((p) => ({ time: p.time, value: p.value }))
    );
    volSeriesRef.current.setData(
      points.map((p, i) => ({
        time: p.time,
        value: p.volume,
        color: i === 0 || p.value >= points[i - 1].value
          ? "rgba(38,166,154,0.5)"
          : "rgba(239,83,80,0.5)",
      }))
    );

    const chart = chartRef.current;
    if (chart) {
      const timeScale = chart.timeScale();
      // Sağda makul bir boşluk bırak (son nokta kenara yapışmasın), ama
      // yapay olarak zaman aralığını GENİŞLETME — bu, veri olmayan bölgede
      // çizginin düz uzayıp gitmesine (boş alan hissi) sebep oluyordu.
      const rightOffsetBars = Math.min(8, Math.max(2, Math.floor(points.length * 0.3)));
      timeScale.applyOptions({ rightOffset: rightOffsetBars });
      timeScale.fitContent();

      // Line/area chart'ta autoscale doğal çalışır — tek değer (close) olduğu için
      // candlestick'teki high/low/wick domine etme sorunu burada hiç oluşmaz.
      chart.priceScale("right").applyOptions({ autoScale: true });
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
          <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
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