"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0A0A0A]">
      
      {/* ========== 1. ANA GRADIENT ZEMİN ========== */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0A12] to-[#0A0A0A]" />
      
      {/* ========== 2. MERKEZ LED IŞIĞI (YAYILAN) ========== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/5 blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/8 blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/15 blur-[70px] animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[oklch(51.8%_0.253_323.949)]/50 blur-[3px]" />
      
      {/* ========== 3. IŞIK HÜZMELERİ (RADYAL) ========== */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={`beam-${i}`}
            className="absolute top-1/2 left-1/2 w-[200%] h-[1px] origin-center bg-gradient-to-r from-transparent via-[oklch(51.8%_0.253_323.949)]/6 to-transparent animate-spin-slow"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
              animationDuration: "25s",
            }}
          />
        ))}
      </div>
      
      {/* ========== 4. TERS YÖNDE IŞIK HÜZMELERİ ========== */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={`reverse-beam-${i}`}
            className="absolute top-1/2 left-1/2 w-[150%] h-[0.5px] origin-center bg-gradient-to-r from-transparent via-[oklch(51.8%_0.253_323.949)]/4 to-transparent animate-spin-slow"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 60 + 30}deg)`,
              animationDuration: "18s",
              animationDirection: "reverse",
            }}
          />
        ))}
      </div>
      
      {/* ========== 5. GENİŞLEYEN IŞIK HALKaLARI ========== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[oklch(51.8%_0.253_323.949)]/10 animate-ping-slow" style={{ animationDuration: "8s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[oklch(51.8%_0.253_323.949)]/6 animate-ping-slow" style={{ animationDuration: "12s", animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-[oklch(51.8%_0.253_323.949)]/4 animate-ping-slow" style={{ animationDuration: "16s", animationDelay: "2s" }} />
      
      {/* ========== 6. IŞIK PARÇACIKLARI (UÇUŞAN) ========== */}
      {[...Array(16)].map((_, i) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 8 + Math.random() * 10;
        const size = 1 + Math.random() * 3;
        const opacity = 0.1 + Math.random() * 0.2;
        
        return (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full bg-[oklch(51.8%_0.253_323.949)] animate-float"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      
      {/* ========== 7. BÜYÜK BLUR DAIRELER (DERİNLİK) ========== */}
      <div className="absolute -top-[30%] -left-[20%] w-[600px] h-[600px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/3 blur-[120px]" />
      <div className="absolute -bottom-[30%] -right-[20%] w-[600px] h-[600px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/3 blur-[120px]" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/4 blur-[100px]" />
      <div className="absolute bottom-[40%] left-[10%] w-[300px] h-[300px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/4 blur-[100px]" />
      
      {/* ========== 8. KENAR KARARTMALARI (GÖZ YORMAMASI İÇİN) ========== */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A] opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0A] via-transparent to-[#0A0A0A] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-[#0A0A0A] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A] opacity-60" />
      
      {/* ========== 9. KÖŞE KARARTMALARI ========== */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#0A0A0A] to-transparent rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0A0A0A] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#0A0A0A] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#0A0A0A] to-transparent rounded-full blur-3xl" />
      
      {/* ========== 10. MERKEZ IŞIK PARLAKLİĞİ (İNCE) ========== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full bg-gradient-to-r from-transparent via-[oklch(51.8%_0.253_323.949)]/10 to-transparent blur-2xl" />
      
    </div>
  );
}