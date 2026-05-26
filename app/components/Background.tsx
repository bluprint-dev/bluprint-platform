"use client";

import { useEffect, useRef } from "react";

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    // ── MATRIX RAIN (hex addresses + crypto symbols) ──
    const CHARS = "0123456789ABCDEF◎₿ΞSOL◈$∞△▲◆■●";
    const FONT_SIZE = 13;
    let cols: number;
    let drops: { y: number; speed: number; opacity: number; bright: boolean }[];

    // ── PRICE CANDLES ──
    type Candle = { x: number; open: number; close: number; high: number; low: number; bull: boolean };
    let candles: Candle[] = [];

    // ── NETWORK NODES ──
    type Node = { x: number; y: number; vx: number; vy: number; size: number; opacity: number };
    let nodes: Node[] = [];

    // ── RISING NUMBERS ──
    type RisingNum = { x: number; y: number; vy: number; value: string; opacity: number; size: number };
    let risingNums: RisingNum[] = [];

    const init = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Matrix columns
      cols = Math.floor(W / FONT_SIZE);
      drops = Array.from({ length: cols }, () => ({
        y: Math.random() * H,
        speed: 0.4 + Math.random() * 0.8,
        opacity: 0.03 + Math.random() * 0.07,
        bright: Math.random() < 0.08,
      }));

      // Candles — sağ tarafta gizli fiyat grafiği
      candles = [];
      let price = 0.5;
      for (let i = 0; i < 40; i++) {
        const change = (Math.random() - 0.42) * 0.06;
        const open = price;
        const close = Math.max(0.1, price + change);
        const high = Math.max(open, close) + Math.random() * 0.02;
        const low = Math.min(open, close) - Math.random() * 0.02;
        candles.push({ x: 0, open, close, high, low, bull: close >= open });
        price = close;
      }

      // Network nodes
      nodes = Array.from({ length: 28 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: 1 + Math.random() * 2,
        opacity: 0.05 + Math.random() * 0.12,
      }));

      // Rising numbers (portfolio değerleri)
      risingNums = Array.from({ length: 18 }, () => {
        const vals = ["$1,240", "$8.5K", "+340%", "$42K", "1.5 SOL", "+128%", "$200K", "×10", "$3,800", "+500%", "2.4 SOL", "$15K", "+89%", "×25", "$680", "+212%", "8 SOL", "$1.1M"];
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vy: -(0.15 + Math.random() * 0.25),
          value: vals[Math.floor(Math.random() * vals.length)],
          opacity: 0,
          size: 10 + Math.random() * 3,
        };
      });
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.006;
      const W = canvas.width;
      const H = canvas.height;

      // Clear
      ctx.fillStyle = "rgba(10,10,15,0.18)";
      ctx.fillRect(0, 0, W, H);

      // ── 1. GRID ──
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      const gs = 50;
      for (let x = 0; x <= W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ── 2. MATRIX RAIN ──
      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];

        if (drop.bright) {
          // Parlak harf — altın/sarı, wealth hissi
          ctx.fillStyle = `rgba(255,45,149,${drop.opacity * 3.5})`;
        } else {
          ctx.fillStyle = `rgba(180,180,200,${drop.opacity})`;
        }

        ctx.fillText(char, i * FONT_SIZE, drop.y);

        drop.y += drop.speed;
        if (drop.y > H) {
          drop.y = 0;
          drop.bright = Math.random() < 0.08;
          drop.opacity = 0.025 + Math.random() * 0.06;
        }
      }

      // ── 3. CANDLE CHART (sağ taraf, yarı saydam) ──
      const chartX = W * 0.72;
      const chartW = W * 0.26;
      const chartY = H * 0.15;
      const chartH = H * 0.4;
      const cw = chartW / candles.length;

      // Fiyat aralığı
      const allPrices = candles.flatMap((c) => [c.high, c.low]);
      const minP = Math.min(...allPrices);
      const maxP = Math.max(...allPrices);
      const pRange = maxP - minP || 0.01;

      const toY = (p: number) => chartY + chartH - ((p - minP) / pRange) * chartH;

      candles.forEach((c, i) => {
        const cx = chartX + i * cw + cw * 0.5;
        const openY = toY(c.open);
        const closeY = toY(c.close);
        const highY = toY(c.high);
        const lowY = toY(c.low);
        const alpha = 0.06 + (i / candles.length) * 0.1;
        const color = c.bull ? `rgba(0,220,130,${alpha})` : `rgba(255,80,80,${alpha * 0.7})`;

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, highY);
        ctx.lineTo(cx, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        const bodyH = Math.abs(openY - closeY) || 1;
        ctx.fillRect(cx - cw * 0.3, Math.min(openY, closeY), cw * 0.6, bodyH);
      });

      // Trend çizgisi (yükselen)
      const lastClose = candles[candles.length - 1].close;
      const firstClose = candles[0].close;
      if (lastClose > firstClose) {
        ctx.strokeStyle = `rgba(0,220,130,${0.08 + Math.sin(t) * 0.02})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        candles.forEach((c, i) => {
          const cx = chartX + i * cw + cw * 0.5;
          const cy = toY(c.close);
          i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── 4. NETWORK NODES & CONNECTIONS ──
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // Bağlantılar
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.06;
            ctx.strokeStyle = `rgba(140,140,180,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Node noktaları
      nodes.forEach((n) => {
        ctx.fillStyle = `rgba(160,160,200,${n.opacity})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── 5. RISING WEALTH NUMBERS ──
      ctx.font = "bold 11px 'Courier New', monospace";
      risingNums.forEach((r) => {
        r.y += r.vy;
        r.opacity += 0.003;
        if (r.y < -20 || r.opacity > 0.22) {
          // Reset
          const vals = ["$1,240", "$8.5K", "+340%", "$42K", "1.5 SOL", "+128%", "$200K", "×10", "$3,800", "+500%", "2.4 SOL", "$15K", "+89%", "×25", "$680", "+212%", "8 SOL", "$1.1M"];
          r.x = Math.random() * W;
          r.y = H + 10;
          r.opacity = 0;
          r.value = vals[Math.floor(Math.random() * vals.length)];
          r.vy = -(0.12 + Math.random() * 0.2);
        }
        const isGain = r.value.includes("+") || r.value.includes("×") || r.value.includes("M") || r.value.includes("K");
        ctx.fillStyle = isGain
          ? `rgba(0,210,120,${r.opacity})`
          : `rgba(200,200,220,${r.opacity})`;
        ctx.fillText(r.value, r.x, r.y);
      });

      // ── 6. SUBTLE SOLANA ARCS (üstte) ──
      const arcCenters = [
        { x: W * 0.15, y: H * 0.08, r: 60 },
        { x: W * 0.85, y: H * 0.12, r: 45 },
        { x: W * 0.5, y: H * 0.95, r: 80 },
      ];
      arcCenters.forEach((a, i) => {
        const phase = t * 0.5 + i * 2.1;
        ctx.strokeStyle = `rgba(153,69,255,${0.04 + Math.sin(phase) * 0.02})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.strokeStyle = `rgba(20,241,149,${0.03 + Math.sin(phase + 1) * 0.015})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r * 0.6, 0, Math.PI * 1.2);
        ctx.stroke();
      });

      // ── 7. VIGNETTE ──
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(10,10,15,0.75)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ display: "block" }}
    />
  );
}