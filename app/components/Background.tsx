"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

      {/* ===== BASE ===== */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />

      {/* ===== GRID ===== */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,45,149,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,45,149,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ===== HERO LED — "Launch your meme coin in seconds" arkası ===== */}
      {/* Ana yayılan ışık */}
      <div
        className="absolute"
        style={{
          top: "28%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(255,45,149,0.45) 0%, rgba(255,45,149,0.18) 30%, rgba(255,45,149,0.06) 60%, transparent 80%)",
          filter: "blur(30px)",
          animation: "heroGlow 4s ease-in-out infinite",
        }}
      />

      {/* Keskin LED çizgi — tam yazının altında */}
      <div
        className="absolute"
        style={{
          top: "33%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "520px",
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,45,149,0.9) 20%, rgba(255,107,203,1) 50%, rgba(255,45,149,0.9) 80%, transparent 100%)",
          boxShadow:
            "0 0 12px 3px rgba(255,45,149,0.8), 0 0 40px 10px rgba(255,45,149,0.4), 0 0 80px 20px rgba(255,45,149,0.2)",
          animation: "ledLine 4s ease-in-out infinite",
          borderRadius: "999px",
        }}
      />

      {/* Yukarı ışık huzmesi */}
      <div
        className="absolute"
        style={{
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "400px",
          height: "30%",
          background:
            "linear-gradient(to bottom, transparent, rgba(255,45,149,0.15) 60%, rgba(255,45,149,0.3))",
          filter: "blur(20px)",
          animation: "beam 4s ease-in-out infinite",
        }}
      />

      {/* Aşağı ışık huzmesi */}
      <div
        className="absolute"
        style={{
          top: "33%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "35%",
          background:
            "linear-gradient(to bottom, rgba(255,45,149,0.25), rgba(255,45,149,0.08) 50%, transparent)",
          filter: "blur(25px)",
          animation: "beam 4s ease-in-out infinite",
        }}
      />

      {/* ===== KÖŞE AMBIENT ORBS ===== */}
      {/* Sol üst */}
      <div
        className="absolute"
        style={{
          top: "-15%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,45,149,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "orbFloat1 12s ease-in-out infinite",
        }}
      />

      {/* Sağ alt */}
      <div
        className="absolute"
        style={{
          bottom: "-15%",
          right: "-10%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,45,149,0.10) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "orbFloat2 15s ease-in-out infinite",
        }}
      />

      {/* Orta sol */}
      <div
        className="absolute"
        style={{
          top: "40%",
          left: "-5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,45,149,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "orbFloat3 10s ease-in-out infinite",
        }}
      />

      {/* ===== DATA LINES ===== */}
      <div
        className="absolute"
        style={{
          top: "20%",
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,45,149,0.5), transparent)",
          animation: "dataLine 8s linear infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "55%",
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,45,149,0.4), transparent)",
          animation: "dataLineReverse 11s linear infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "75%",
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,45,149,0.35), transparent)",
          animation: "dataLine 14s linear infinite",
        }}
      />

      {/* ===== PARTIKÜLLER ===== */}
      {[
        { left: "12%", top: "18%", size: 2.5, opacity: 0.6, dur: "9s", delay: "0s" },
        { left: "28%", top: "72%", size: 1.8, opacity: 0.5, dur: "12s", delay: "1.5s" },
        { left: "45%", top: "10%", size: 3, opacity: 0.7, dur: "8s", delay: "0.5s" },
        { left: "63%", top: "85%", size: 2, opacity: 0.5, dur: "11s", delay: "3s" },
        { left: "78%", top: "25%", size: 2.5, opacity: 0.6, dur: "10s", delay: "1s" },
        { left: "88%", top: "60%", size: 1.5, opacity: 0.4, dur: "13s", delay: "2s" },
        { left: "8%", top: "50%", size: 2, opacity: 0.5, dur: "9s", delay: "4s" },
        { left: "55%", top: "45%", size: 1.5, opacity: 0.4, dur: "15s", delay: "0.8s" },
        { left: "33%", top: "38%", size: 2.5, opacity: 0.55, dur: "10s", delay: "2.5s" },
        { left: "72%", top: "78%", size: 1.8, opacity: 0.45, dur: "12s", delay: "1.2s" },
        { left: "20%", top: "92%", size: 2, opacity: 0.4, dur: "11s", delay: "3.5s" },
        { left: "90%", top: "15%", size: 2.5, opacity: 0.6, dur: "8s", delay: "0.3s" },
        { left: "50%", top: "65%", size: 1.5, opacity: 0.35, dur: "14s", delay: "2.8s" },
        { left: "38%", top: "55%", size: 3, opacity: 0.5, dur: "9s", delay: "1.8s" },
        { left: "68%", top: "42%", size: 2, opacity: 0.45, dur: "13s", delay: "0.6s" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `rgba(255,45,149,${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px rgba(255,45,149,${p.opacity * 0.8})`,
            animation: `particle ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* ===== VİNYET ===== */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(10,10,15,0.7) 100%)",
        }}
      />

      <style jsx>{`
        @keyframes heroGlow {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes ledLine {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 12px 3px rgba(255,45,149,0.8), 0 0 40px 10px rgba(255,45,149,0.4), 0 0 80px 20px rgba(255,45,149,0.2); }
          50%       { opacity: 1;   box-shadow: 0 0 20px 6px rgba(255,45,149,1),   0 0 60px 20px rgba(255,45,149,0.6), 0 0 120px 40px rgba(255,45,149,0.3); }
        }
        @keyframes beam {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1;   }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, 20px) scale(1.05); }
          66%      { transform: translate(-20px, 30px) scale(0.97); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(-40px, -20px) scale(1.08); }
          66%      { transform: translate(20px, -30px) scale(0.95); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(15px, -25px) scale(1.1); }
        }
        @keyframes dataLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes dataLineReverse {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          20%      { opacity: 1; }
          80%      { opacity: 0.8; }
          50%      { transform: translateY(-40px) translateX(20px); }
        }
      `}</style>
    </div>
  );
}