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
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      t += 0.008;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Base
      ctx.fillStyle = "#0A0A0F";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(255,45,149,0.055)";
      ctx.lineWidth = 1;
      const gs = 55;
      for (let x = 0; x <= W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ── HERO LED GLOW ──
      // Hero yazısı ekranın ~%32'sinde (pt-24 + h-text ≈ 280px / 900px ekran)
      const heroY = H * 0.32;
      const heroX = W * 0.5;

      // Büyük derin glow
      const g1 = ctx.createRadialGradient(heroX, heroY, 0, heroX, heroY, W * 0.55);
      const pulse1 = 0.18 + Math.sin(t * 0.7) * 0.06;
      g1.addColorStop(0, `rgba(255,45,149,${pulse1})`);
      g1.addColorStop(0.35, `rgba(255,45,149,${pulse1 * 0.35})`);
      g1.addColorStop(0.7, `rgba(255,45,149,${pulse1 * 0.08})`);
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // Orta yoğun glow
      const g2 = ctx.createRadialGradient(heroX, heroY, 0, heroX, heroY, W * 0.28);
      const pulse2 = 0.35 + Math.sin(t * 0.9) * 0.1;
      g2.addColorStop(0, `rgba(255,107,203,${pulse2})`);
      g2.addColorStop(0.4, `rgba(255,45,149,${pulse2 * 0.3})`);
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // LED çizgi
      const ledW = Math.min(W * 0.55, 580);
      const ledX = heroX - ledW / 2;
      const ledOpacity = 0.75 + Math.sin(t * 1.1) * 0.25;
      const lg = ctx.createLinearGradient(ledX, 0, ledX + ledW, 0);
      lg.addColorStop(0, "transparent");
      lg.addColorStop(0.15, `rgba(255,45,149,${ledOpacity * 0.6})`);
      lg.addColorStop(0.5, `rgba(255,255,255,${ledOpacity})`);
      lg.addColorStop(0.85, `rgba(255,45,149,${ledOpacity * 0.6})`);
      lg.addColorStop(1, "transparent");

      // Glow halo
      ctx.save();
      ctx.shadowColor = "#ff2d95";
      ctx.shadowBlur = 18 + Math.sin(t) * 6;
      ctx.strokeStyle = lg;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ledX, heroY + H * 0.045);
      ctx.lineTo(ledX + ledW, heroY + H * 0.045);
      ctx.stroke();
      ctx.shadowBlur = 35;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Yukarı ışık huzmesi
      const beam1 = ctx.createLinearGradient(0, heroY, 0, 0);
      beam1.addColorStop(0, `rgba(255,45,149,${0.12 + Math.sin(t) * 0.04})`);
      beam1.addColorStop(1, "transparent");
      ctx.fillStyle = beam1;
      const bw = Math.min(W * 0.45, 500);
      ctx.fillRect(heroX - bw / 2, 0, bw, heroY);

      // Aşağı ışık huzmesi
      const beam2 = ctx.createLinearGradient(0, heroY, 0, H * 0.75);
      beam2.addColorStop(0, `rgba(255,45,149,${0.1 + Math.sin(t * 0.8) * 0.03})`);
      beam2.addColorStop(1, "transparent");
      ctx.fillStyle = beam2;
      ctx.fillRect(heroX - bw / 2, heroY, bw, H * 0.75 - heroY);

      // ── KÖŞE AMBIENT ──
      // Sol üst
      const ga1 = ctx.createRadialGradient(-W * 0.1, -H * 0.1, 0, -W * 0.1, -H * 0.1, W * 0.6);
      ga1.addColorStop(0, `rgba(255,45,149,${0.08 + Math.sin(t * 0.5) * 0.02})`);
      ga1.addColorStop(1, "transparent");
      ctx.fillStyle = ga1;
      ctx.fillRect(0, 0, W, H);

      // Sağ alt
      const ga2 = ctx.createRadialGradient(W * 1.1, H * 1.1, 0, W * 1.1, H * 1.1, W * 0.65);
      ga2.addColorStop(0, `rgba(255,45,149,${0.07 + Math.sin(t * 0.6 + 1) * 0.02})`);
      ga2.addColorStop(1, "transparent");
      ctx.fillStyle = ga2;
      ctx.fillRect(0, 0, W, H);

      // Sol orta
      const ga3 = ctx.createRadialGradient(0, H * 0.6, 0, 0, H * 0.6, W * 0.4);
      ga3.addColorStop(0, `rgba(255,45,149,${0.06 + Math.sin(t * 0.4 + 2) * 0.02})`);
      ga3.addColorStop(1, "transparent");
      ctx.fillStyle = ga3;
      ctx.fillRect(0, 0, W, H);

      // ── DATA LINES ──
      const linePositions = [0.22, 0.48, 0.68, 0.85];
      linePositions.forEach((yp, i) => {
        const speed = [0.4, 0.25, 0.35, 0.28][i];
        const offset = ((t * speed) % 2) - 1;
        const lineY = H * yp;
        const lw = W * 1.2;
        const lx = offset * lw;
        const ll = ctx.createLinearGradient(lx, 0, lx + lw, 0);
        ll.addColorStop(0, "transparent");
        ll.addColorStop(0.3, `rgba(255,45,149,${[0.25, 0.18, 0.22, 0.15][i]})`);
        ll.addColorStop(0.5, `rgba(255,107,203,${[0.4, 0.28, 0.35, 0.22][i]})`);
        ll.addColorStop(0.7, `rgba(255,45,149,${[0.25, 0.18, 0.22, 0.15][i]})`);
        ll.addColorStop(1, "transparent");
        ctx.strokeStyle = ll;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(lx, lineY);
        ctx.lineTo(lx + lw, lineY);
        ctx.stroke();
        // Reverse lines
        if (i % 2 === 1) {
          const lx2 = -offset * lw;
          const ll2 = ctx.createLinearGradient(lx2, 0, lx2 + lw, 0);
          ll2.addColorStop(0, "transparent");
          ll2.addColorStop(0.4, `rgba(255,45,149,${[0.15, 0.12][Math.floor(i / 2)]})`);
          ll2.addColorStop(0.6, `rgba(255,45,149,${[0.15, 0.12][Math.floor(i / 2)]})`);
          ll2.addColorStop(1, "transparent");
          ctx.strokeStyle = ll2;
          ctx.beginPath();
          ctx.moveTo(lx2, lineY + H * 0.12);
          ctx.lineTo(lx2 + lw, lineY + H * 0.12);
          ctx.stroke();
        }
      });

      // ── PARTİKÜLLER ──
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.03;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
        const op = p.opacity * (0.6 + Math.sin(p.pulse) * 0.4);
        ctx.save();
        ctx.shadowColor = "#ff2d95";
        ctx.shadowBlur = p.size * 4;
        ctx.fillStyle = `rgba(255,45,149,${op})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(10,10,15,0.65)");
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