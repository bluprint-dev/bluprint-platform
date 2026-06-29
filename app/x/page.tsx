"use client";
import { useEffect, useRef } from "react";

export default function ComingSoonPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#9945FF", "#14F195", "#ff2d95"];
    const COUNT = 60;

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .cs-root {
          min-height: 100vh;
          background: #0A0A0F;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Space Grotesk', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 40px 20px;
        }

        .cs-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.15;
          pointer-events: none;
          animation: orb-float 8s ease-in-out infinite;
        }
        .orb1 { width: 500px; height: 500px; background: #9945FF; top: -120px; right: -100px; animation-delay: 0s; }
        .orb2 { width: 400px; height: 400px; background: #14F195; bottom: -80px; left: -80px; animation-delay: -3s; }
        .orb3 { width: 260px; height: 260px; background: #ff2d95; top: 40%; left: 20%; opacity: 0.08; animation-delay: -5s; }

        @keyframes orb-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        .grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(153,69,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(153,69,255,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .cs-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 620px;
          width: 100%;
        }

        .cs-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(20,241,149,0.08);
          border: 1px solid rgba(20,241,149,0.25);
          border-radius: 100px;
          padding: 6px 16px;
          margin-bottom: 36px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #14F195;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .cs-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #14F195;
          animation: cs-pulse 1.8s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes cs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .cs-logo {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(44px, 12vw, 80px);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
          animation: fade-up 0.8s ease both;
        }
        .cs-logo-blu { color: #9945FF; }
        .cs-logo-print { color: #14F195; }
        .cs-logo-fun { color: #ffffff; }

        .cs-logo-sub {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
          margin-bottom: 44px;
          animation: fade-up 0.8s 0.1s ease both;
        }

        .cs-headline {
          font-size: clamp(22px, 5vw, 42px);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 18px;
          animation: fade-up 0.8s 0.2s ease both;
        }
        .cs-green { color: #14F195; }
        .cs-purple { color: #9945FF; }

        .cs-subline {
          font-size: 15px;
          font-weight: 400;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          margin-bottom: 48px;
          max-width: 460px;
          margin-left: auto;
          margin-right: auto;
          animation: fade-up 0.8s 0.3s ease both;
        }

        .cs-stats {
          display: flex;
          justify-content: center;
          gap: clamp(20px, 6vw, 40px);
          margin-bottom: 48px;
          flex-wrap: wrap;
          animation: fade-up 0.8s 0.4s ease both;
        }

        .cs-stat { text-align: center; }

        .cs-stat-val {
          font-family: 'Space Mono', monospace;
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 4px;
        }
        .cs-stat-val.g { color: #14F195; }
        .cs-stat-val.p { color: #9945FF; }
        .cs-stat-val.pk { color: #ff2d95; }

        .cs-stat-label {
          font-size: 10px;
          font-weight: 500;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .cs-stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.08);
          align-self: stretch;
        }

        .cs-cta-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 48px;
          animation: fade-up 0.8s 0.5s ease both;
        }

        .cs-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #9945FF;
          color: #ffffff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 13px 26px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          letter-spacing: -0.01em;
          text-decoration: none;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .cs-btn-primary:hover { background: #7c2de0; transform: translateY(-2px); }
        .cs-btn-primary:active { transform: scale(0.98); }

        .cs-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: rgba(255,255,255,0.65);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 500;
          padding: 13px 22px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .cs-btn-secondary:hover { border-color: rgba(20,241,149,0.4); color: #14F195; transform: translateY(-2px); }

        .cs-ticker {
          display: flex;
          gap: clamp(16px, 4vw, 32px);
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
          animation: fade-up 0.8s 0.6s ease both;
        }

        .cs-tick-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.22);
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .cs-tick-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .cs-tick-dot.g { background: #14F195; opacity: 0.6; }
        .cs-tick-dot.p { background: #9945FF; opacity: 0.6; }
        .cs-tick-dot.pk { background: #ff2d95; opacity: 0.6; }

        .cs-bottom-line {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #9945FF, #14F195, transparent);
          opacity: 0.4;
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .cs-stat-divider { display: none; }
          .cs-stats { gap: 24px; }
        }
      `}</style>

      <div className="cs-root">
        <canvas ref={canvasRef} className="cs-canvas" />
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />
        <div className="grid-lines" />

        <div className="cs-content">
          <div className="cs-badge">
            <span className="cs-badge-dot" />
            Launching on Solana
          </div>

          <div className="cs-logo">
            <span className="cs-logo-blu">Blu</span>
            <span className="cs-logo-print">Print</span>
            <span className="cs-logo-fun">.fun</span>
          </div>
          <div className="cs-logo-sub">meme coin launchpad</div>

          <h1 className="cs-headline">
            The next 100x starts<br />
            <span className="cs-green">here.</span>{" "}
            <span className="cs-purple">First.</span>
          </h1>

          <p className="cs-subline">
            Create, launch and trade meme coins on Solana in seconds.
            Bonding curves, instant liquidity, zero coding — just vibes and alpha.
          </p>

          <div className="cs-stats">
            <div className="cs-stat">
              <div className="cs-stat-val g">5s</div>
              <div className="cs-stat-label">Launch time</div>
            </div>
            <div className="cs-stat-divider" />
            <div className="cs-stat">
              <div className="cs-stat-val p">∞</div>
              <div className="cs-stat-label">Upside</div>
            </div>
            <div className="cs-stat-divider" />
            <div className="cs-stat">
              <div className="cs-stat-val pk">1</div>
              <div className="cs-stat-label">Click to start</div>
            </div>
          </div>

          <div className="cs-cta-row">
            <a className="cs-btn-primary" href="https://x.com/BluprintFun" target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow on X
            </a>
            <a className="cs-btn-secondary" href="https://x.com/BluprintFun" target="_blank" rel="noopener noreferrer">
              Get early access ↗
            </a>
          </div>

          <div className="cs-ticker">
            <div className="cs-tick-item"><span className="cs-tick-dot g" />Solana native</div>
            <div className="cs-tick-item"><span className="cs-tick-dot p" />Bonding curve</div>
            <div className="cs-tick-item"><span className="cs-tick-dot pk" />Instant trading</div>
            <div className="cs-tick-item"><span className="cs-tick-dot g" />No-code launch</div>
          </div>
        </div>

        <div className="cs-bottom-line" />
      </div>
    </>
  );
}