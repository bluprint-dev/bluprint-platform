"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0A0A0F]">
      {/* Ana gradient zemin */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#0F0A14] to-[#0A0A0F]" />
      
      {/* Pembe glow - merkezden yayılan */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/5 blur-[150px]" />
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/8 blur-[100px]" />
      <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/5 blur-[120px]" />

      {/* Blockchain bağlantı ağı - SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(51.8%_0.253_323.949)" />
            <stop offset="100%" stopColor="oklch(70%_0.25_150)" />
          </linearGradient>
        </defs>
        
        {/* Bağlantı çizgileri */}
        <line x1="15%" y1="25%" x2="35%" y2="45%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="35%" y1="45%" x2="55%" y2="30%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="55%" y1="30%" x2="75%" y2="50%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="75%" y1="50%" x2="85%" y2="25%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="15%" y1="25%" x2="25%" y2="70%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="25%" y1="70%" x2="50%" y2="80%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="50%" y1="80%" x2="75%" y2="70%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="75%" y1="70%" x2="85%" y2="25%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="35%" y1="45%" x2="50%" y2="80%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="55%" y1="30%" x2="75%" y2="70%" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3" />
        
        {/* Noktalar (node'lar) */}
        <circle cx="15%" cy="25%" r="2" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="35%" cy="45%" r="2" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="55%" cy="30%" r="2" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="75%" cy="50%" r="2" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.45;0.1" dur="4.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="85%" cy="25%" r="2" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.35;0.1" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="25%" cy="70%" r="2" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="80%" r="2.5" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="75%" cy="70%" r="2" fill="oklch(51.8%_0.253_323.949)" opacity="0.3">
          <animate attributeName="opacity" values="0.1;0.35;0.1" dur="3.2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Blockchain blok deseni - sol alt */}
      <div className="absolute bottom-[8%] left-[5%] opacity-[0.03]">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <rect x="10" y="10" width="30" height="30" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
          <rect x="45" y="10" width="30" height="30" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
          <rect x="10" y="45" width="30" height="30" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
          <rect x="45" y="45" width="30" height="30" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
          <line x1="40" y1="25" x2="45" y2="25" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" />
          <line x1="25" y1="40" x2="25" y2="45" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" />
          <line x1="60" y1="25" x2="75" y2="25" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" />
          <line x1="60" y1="60" x2="75" y2="60" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" />
        </svg>
      </div>

      {/* Blockchain blok deseni - sağ üst */}
      <div className="absolute top-[5%] right-[8%] opacity-[0.03]">
        <svg width="80" height="80" viewBox="0 0 100 100">
          <rect x="20" y="20" width="25" height="25" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
          <rect x="50" y="20" width="25" height="25" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
          <rect x="20" y="50" width="25" height="25" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
          <rect x="50" y="50" width="25" height="25" stroke="oklch(51.8%_0.253_323.949)" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Kripto sembolleri - çok hafif */}
      <div className="absolute top-[20%] left-[15%] opacity-[0.02] font-mono text-8xl font-black text-white">
        ₿
      </div>
      <div className="absolute bottom-[25%] right-[10%] opacity-[0.02] font-mono text-7xl font-black text-white">
        ◈
      </div>
      <div className="absolute top-[60%] right-[20%] opacity-[0.015] font-mono text-6xl font-black text-white">
        Ξ
      </div>
      <div className="absolute bottom-[40%] left-[12%] opacity-[0.015] font-mono text-7xl font-black text-white">
        ⎊
      </div>

      {/* Hareket eden ışık partikülleri */}
      <div className="absolute top-[30%] left-[25%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/20">
        <div className="animate-ping w-full h-full rounded-full bg-[oklch(51.8%_0.253_323.949)]/20" />
      </div>
      <div className="absolute top-[50%] left-[60%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/15">
        <div className="animate-ping w-full h-full rounded-full bg-[oklch(51.8%_0.253_323.949)]/15" style={{ animationDuration: "2s" }} />
      </div>
      <div className="absolute top-[70%] left-[40%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/25">
        <div className="animate-ping w-full h-full rounded-full bg-[oklch(51.8%_0.253_323.949)]/25" style={{ animationDuration: "2.5s" }} />
      </div>

      {/* Gradient overlay - alt kısımda karartma */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0A0A0F] to-transparent" />
    </div>
  );
}