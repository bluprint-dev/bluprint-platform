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

    // MATRIX RAIN - daha belirgin
    const CHARS = "0123456789ABCDEF◎₿ΞSOL◈$∞△▲◆■●";
    const FONT_SIZE = 14;
    let cols: number;
    let drops: { y: number; speed: number; opacity: number; bright: boolean }[];

    // PRICE CANDLES - daha belirgin
    type Candle = { x: number; open: number; close: number; high: number; low: number; bull: boolean };
    let candles: Candle[] = [];

    // NETWORK NODES - daha fazla ve belirgin
    type Node = { x: number; y: number; vx: number; vy: number; size: number; opacity: number };
    let nodes: Node[] = [];

    // RISING NUMBERS - daha belirgin
    type RisingNum = { x: number; y: number; vy: number; value: string; opacity: number; size: number };
    let risingNums: RisingNum[] = [];

    const init = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Matrix columns
      cols = Math.floor(W / FONT_SIZE);
      drops = Array.from({ length: cols }, () => ({
        y: Math.random() * H,
        speed: 0.5 + Math.random() * 1.2,
        opacity: 0.08 + Math.random() * 0.12,
        bright: Math.random() < 0.15,
      }));

      // Candles
      candles = [];
      let price = 0.5;
      for (let i = 0; i < 50; i++) {
        const change = (Math.random() - 0.42) * 0.08;
        const open = price;
        const close = Math.max(0.1, price + change);
        const high = Math.max(open, close) + Math.random() * 0.03;
        const low = Math.min(open, close) - Math.random() * 0.03;
        candles.push({ x: 0, open, close, high, low, bull: close >= open });
        price = close;
      }

      // Network nodes - daha fazla
      nodes = Array.from({ length: 45 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: 1.5 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.2,
      }));

      // Rising numbers
      risingNums = Array.from({ length: 25 }, () => {
        const vals = ["$1,240", "$8.5K", "+340%", "$42K", "1.5 SOL", "+128%", "$200K", "×10", "$3,800", "+500%", "2.4 SOL", "$15K", "+89%", "×25", "$680", "+212%", "8 SOL", "$1.1M"];
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vy: -(0.2 + Math.random() * 0.35),
          value: vals[Math.floor(Math.random() * vals.length)],
          opacity: 0,
          size: 11 + Math.random() * 4,
        };
      });
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.008;
      const W = canvas.width;
      const H = canvas.height;

      // Clear with darker background
      ctx.fillStyle = "rgba(8, 8, 12, 0.85)";
      ctx.fillRect(0, 0, W, H);

      // GRID - daha belirgin
      ctx.strokeStyle = "rgba(255,45,149,0.08)";
      ctx.lineWidth = 0.8;
      const gs = 40;
      for (let x = 0; x <= W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // MATRIX RAIN - daha belirgin
      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];

        if (drop.bright) {
          ctx.fillStyle = `rgba(255,45,149,${drop.opacity * 2.5})`;
        } else {
          ctx.fillStyle = `rgba(180, 180, 220, ${drop.opacity})`;
        }

        ctx.fillText(char, i * FONT_SIZE, drop.y);

        drop.y += drop.speed;
        if (drop.y > H) {
          drop.y = 0;
          drop.bright = Math.random() < 0.12;
          drop.opacity = 0.06 + Math.random() * 0.1;
        }
      }

      // CANDLE CHART - daha belirgin, sağ altta
      const chartX = W * 0.7;
      const chartW = W * 0.28;
      const chartY = H * 0.6;
      const chartH = H * 0.35;
      const cw = chartW / candles.length;

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
        const alpha = 0.15 + (i / candles.length) * 0.2;
        const color = c.bull ? `rgba(0, 255, 150, ${alpha})` : `rgba(255, 80, 120, ${alpha * 0.8})`;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, highY);
        ctx.lineTo(cx, lowY);
        ctx.stroke();

        ctx.fillStyle = color;
        const bodyH = Math.abs(openY - closeY) || 1.5;
        ctx.fillRect(cx - cw * 0.35, Math.min(openY, closeY), cw * 0.7, bodyH);
      });

      // Trend line
      const lastClose = candles[candles.length - 1].close;
      const firstClose = candles[0].close;
      if (lastClose > firstClose) {
        ctx.strokeStyle = `rgba(0, 255, 150, 0.25)`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        candles.forEach((c, i) => {
          const cx = chartX + i * cw + cw * 0.5;
          const cy = toY(c.close);
          i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // NETWORK NODES - daha belirgin
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12;
            ctx.strokeStyle = `rgba(255, 100, 180, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach((n) => {
        ctx.fillStyle = `rgba(255, 100, 200, ${n.opacity})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // RISING NUMBERS - daha belirgin
      ctx.font = "bold 12px 'Courier New', monospace";
      risingNums.forEach((r) => {
        r.y += r.vy;
        r.opacity += 0.004;
        if (r.y < -30 || r.opacity > 0.35) {
          const vals = ["$1,240", "$8.5K", "+340%", "$42K", "1.5 SOL", "+128%", "$200K", "×10", "$3,800", "+500%", "2.4 SOL", "$15K", "+89%", "×25", "$680", "+212%", "8 SOL", "$1.1M"];
          r.x = Math.random() * W;
          r.y = H + 20;
          r.opacity = 0;
          r.value = vals[Math.floor(Math.random() * vals.length)];
          r.vy = -(0.15 + Math.random() * 0.3);
        }
        const isGain = r.value.includes("+") || r.value.includes("×") || r.value.includes("M") || r.value.includes("K");
        ctx.fillStyle = isGain
          ? `rgba(0, 255, 120, ${r.opacity * 1.2})`
          : `rgba(200, 200, 255, ${r.opacity})`;
        ctx.fillText(r.value, r.x, r.y);
      });

      // SOLANA ARCS - daha belirgin
      const arcCenters = [
        { x: W * 0.12, y: H * 0.1, r: 80 },
        { x: W * 0.88, y: H * 0.15, r: 60 },
        { x: W * 0.45, y: H * 0.92, r: 90 },
      ];
      arcCenters.forEach((a, i) => {
        const phase = t * 0.6 + i * 2.2;
        ctx.strokeStyle = `rgba(153, 69, 255, ${0.12 + Math.sin(phase) * 0.06})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.strokeStyle = `rgba(20, 241, 149, ${0.1 + Math.sin(phase + 1) * 0.05})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r * 0.65, 0, Math.PI * 1.2);
        ctx.stroke();
      });

      // VIGNETTE - hafif kenar karartma
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.9);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(0, 0, 0, 0.5)");
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
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ display: "block" }}
    />
  );
}