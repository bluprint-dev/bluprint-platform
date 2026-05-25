"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      
      {/* ========== LAYER 1 - DEEP BASE (PEMBE TONLU SİYAH) ========== */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#120A1A] to-[#0A0A0F]" />
      
      {/* ========== LAYER 2 - HAFİF FUTURISTIC GRID ========== */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(51.8% 0.253 323.949) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(51.8% 0.253 323.949) 1px, transparent 1px)
          `,
          backgroundSize: '70px 70px',
        }}
      />
      
      {/* ========== LAYER 3 - YAVAŞ AKAN DATA LINES (PEMBE) ========== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-0 w-full h-[1px] opacity-[0.08] animate-data-line-1"
             style={{ background: 'linear-gradient(90deg, transparent, oklch(51.8% 0.253 323.949), transparent)' }} />
        
        <div className="absolute top-[40%] left-0 w-full h-[1px] opacity-[0.06] animate-data-line-2"
             style={{ background: 'linear-gradient(90deg, transparent, oklch(61.8% 0.253 323.949), transparent)' }} />
        
        <div className="absolute top-[60%] left-0 w-full h-[1px] opacity-[0.08] animate-data-line-3"
             style={{ background: 'linear-gradient(90deg, transparent, oklch(51.8% 0.253 323.949), transparent)' }} />
        
        <div className="absolute top-[80%] left-0 w-full h-[1px] opacity-[0.06] animate-data-line-4"
             style={{ background: 'linear-gradient(90deg, transparent, oklch(61.8% 0.253 323.949), transparent)' }} />
      </div>
      
      {/* ========== LAYER 4 - SOFT GLOW ORBS (PEMBE) ========== */}
      {/* Top-right orb - Pink glow */}
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/8 blur-[120px]" />
      
      {/* Bottom-left orb - Dark Pink */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/6 blur-[120px]" />
      
      {/* Center orb - Soft pink */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/5 blur-[100px]" />
      
      {/* Bottom-right accent */}
      <div className="absolute bottom-[20%] right-[5%] w-[300px] h-[300px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/6 blur-[100px]" />
      
      {/* Middle-left subtle */}
      <div className="absolute top-[50%] left-[5%] w-[250px] h-[250px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/4 blur-[90px]" />
      
      {/* ========== LAYER 5 - TINY PARTICLES (PEMBE, YAVAŞ) ========== */}
      {[...Array(20)].map((_, i) => {
        const randomLeft = Math.random() * 100;
        const randomTop = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 12 + Math.random() * 8;
        const size = 1 + Math.random() * 2;
        const opacity = 0.1 + Math.random() * 0.1;
        
        return (
          <div
            key={i}
            className="absolute rounded-full bg-[oklch(51.8%_0.253_323.949)] animate-float-particle"
            style={{
              left: `${randomLeft}%`,
              top: `${randomTop}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      
      {/* ========== KENAR KARARTMA (MERKEZİ TEMİZ TUT) ========== */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-25" />
      
      {/* ========== MERKEZ TEMİZ ALAN (HERO TEXT İÇİN) ========== */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-gradient-to-b from-transparent via-transparent to-transparent" />
      
      {/* ========== VİNYET EFECT (KENARLAR KARANLIK) ========== */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.5)] pointer-events-none" />
      
    </div>
  );
}