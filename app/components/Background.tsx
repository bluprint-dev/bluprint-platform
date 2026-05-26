"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      
      {/* ========== LAYER 1 - DEEP BASE ========== */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#120A1A] to-[#0A0A0F]" />
      
      {/* ========== LAYER 2 - HAFİF GRID ========== */}
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
      
      {/* ========== LAYER 3 - YAVAŞ AKAN DATA LINES ========== */}
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
      
      {/* ========== LAYER 4 - SOFT GLOW ORBS ========== */}
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/8 blur-[120px]" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/6 blur-[120px]" />
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/5 blur-[100px]" />
      <div className="absolute bottom-[20%] right-[5%] w-[300px] h-[300px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/6 blur-[100px]" />
      <div className="absolute top-[50%] left-[5%] w-[250px] h-[250px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/4 blur-[90px]" />
      
      {/* ========== LAYER 5 - PINK NEON LED (HERO ARKASI) ========== */}
      {/* Ana LED ışık - hero text'in tam arkasında */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/15 blur-[80px] animate-pulse-slow" />
      
      {/* LED şerit - yatay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[3px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/30 shadow-[0_0_20px_oklch(51.8%_0.253_323.949)] animate-pulse-slow" />
      
      {/* LED ışık hüzmesi - yukarı doğru */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-gradient-to-b from-[oklch(51.8%_0.253_323.949)]/20 via-transparent to-transparent blur-[40px]" />
      
      {/* LED ışık hüzmesi - aşağı doğru */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-gradient-to-t from-[oklch(51.8%_0.253_323.949)]/20 via-transparent to-transparent blur-[40px]" />
      
      {/* Ekstra LED parlamalar */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[400px] h-[100px] bg-[oklch(51.8%_0.253_323.949)]/10 blur-[60px] animate-pulse-slow" />
      
      {/* ========== LAYER 6 - TINY PARTICLES ========== */}
      {[...Array(25)].map((_, i) => {
        const randomLeft = Math.random() * 100;
        const randomTop = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 12 + Math.random() * 8;
        const size = 1 + Math.random() * 2.5;
        const opacity = 0.1 + Math.random() * 0.15;
        
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
      
      {/* ========== KENAR KARARTMA ========== */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-25" />
      
      {/* ========== VİNYET EFECT ========== */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.5)] pointer-events-none" />
      
      <style jsx>{`
        @keyframes data-line-1 {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes data-line-2 {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes data-line-3 {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes data-line-4 {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          50% { transform: translateY(-30px) translateX(15px); opacity: 1; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .animate-data-line-1 { animation: data-line-1 8s ease-in-out infinite; }
        .animate-data-line-2 { animation: data-line-2 10s ease-in-out infinite; }
        .animate-data-line-3 { animation: data-line-3 12s ease-in-out infinite; }
        .animate-data-line-4 { animation: data-line-4 9s ease-in-out infinite; }
        .animate-float-particle { animation: float-particle linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}