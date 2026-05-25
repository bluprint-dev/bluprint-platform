"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      
      {/* ========== LAYER 1 - DEEP BASE (TAM SİYAH DEĞİL) ========== */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#0A0A0F] to-[#030712]" />
      
      {/* ========== LAYER 2 - HAFİF FUTURISTIC GRID ========== */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00D2FF 1px, transparent 1px),
            linear-gradient(to bottom, #00D2FF 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* ========== LAYER 3 - YAVAŞ AKAN DATA LINES (SOLANA NETWORK) ========== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Data line 1 */}
        <div className="absolute top-[15%] left-0 w-full h-[1px] opacity-[0.04] animate-data-line-1"
             style={{ background: 'linear-gradient(90deg, transparent, #00D2FF, transparent)' }} />
        
        {/* Data line 2 */}
        <div className="absolute top-[35%] left-0 w-full h-[1px] opacity-[0.03] animate-data-line-2"
             style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }} />
        
        {/* Data line 3 */}
        <div className="absolute top-[55%] left-0 w-full h-[1px] opacity-[0.04] animate-data-line-3"
             style={{ background: 'linear-gradient(90deg, transparent, #00D2FF, transparent)' }} />
        
        {/* Data line 4 */}
        <div className="absolute top-[75%] left-0 w-full h-[1px] opacity-[0.03] animate-data-line-4"
             style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }} />
        
        {/* Data line 5 */}
        <div className="absolute top-[90%] left-0 w-full h-[1px] opacity-[0.02] animate-data-line-5"
             style={{ background: 'linear-gradient(90deg, transparent, #00D2FF, transparent)' }} />
      </div>
      
      {/* ========== LAYER 4 - SOFT GLOW ORBS (KÖŞELERDE) ========== */}
      {/* Top-right orb - Blue/Cyan */}
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#00D2FF]/5 blur-[120px]" />
      
      {/* Bottom-left orb - Dark Indigo */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[#1E3A5F]/8 blur-[120px]" />
      
      {/* Center-top hint - minimal */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#00D2FF]/3 blur-[100px]" />
      
      {/* Bottom-right accent */}
      <div className="absolute bottom-[15%] right-[5%] w-[300px] h-[300px] rounded-full bg-[#3B82F6]/4 blur-[100px]" />
      
      {/* ========== LAYER 5 - TINY PARTICLES (ÇOK AZ, YAVAŞ) ========== */}
      {[...Array(12)].map((_, i) => {
        const randomLeft = Math.random() * 100;
        const randomTop = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 15 + Math.random() * 10;
        
        return (
          <div
            key={i}
            className="absolute rounded-full bg-[#00D2FF] animate-float-particle"
            style={{
              left: `${randomLeft}%`,
              top: `${randomTop}%`,
              width: '1px',
              height: '1px',
              opacity: 0.08,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      
      {/* ========== KENAR KARARTMA (MERKEZİ TEMİZ TUT) ========== */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712] opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-transparent to-[#030712] opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#030712] via-transparent to-[#030712] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-transparent to-[#030712] opacity-20" />
      
      {/* ========== MERKEZ TEMİZ ALAN (HERO TEXT İÇİN) ========== */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-gradient-to-b from-[#030712]/0 via-transparent to-[#030712]/0" />
      
    </div>
  );
}