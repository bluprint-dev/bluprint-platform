"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0A0A0F]">
      {/* Ana gradient zemin */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#0F0A14] to-[#0A0A0F]" />
      
      {/* Merkezde yayılan ana led ışığı - 3 katmanlı glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/5 blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/8 blur-[80px] animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/12 blur-[60px] animate-pulse" style={{ animationDuration: "3s" }} />
      
      {/* Led merkez parlak nokta */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full bg-[oklch(51.8%_0.253_323.949)]/40 blur-[4px]" />
      
      {/* Işık hüzmeleri - radyal ışınlar */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-[200%] h-[2px] origin-center bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)]/0 via-[oklch(51.8%_0.253_323.949)]/6 to-[oklch(51.8%_0.253_323.949)]/0 animate-spin-slow"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
              animationDuration: "30s",
            }}
          />
        ))}
      </div>
      
      {/* İkincil ışık hüzmeleri - ters yönde */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-[150%] h-[1px] origin-center bg-gradient-to-r from-[oklch(51.8%_0.253_323.949)]/0 via-[oklch(51.8%_0.253_323.949)]/4 to-[oklch(51.8%_0.253_323.949)]/0 animate-spin-slow"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 60 + 30}deg)`,
              animationDuration: "20s",
              animationDirection: "reverse",
            }}
          />
        ))}
      </div>
      
      {/* Işık halkaları - genişleyen ringler */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[oklch(51.8%_0.253_323.949)]/10 animate-ping" style={{ animationDuration: "6s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-[oklch(51.8%_0.253_323.949)]/8 animate-ping" style={{ animationDuration: "8s", animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[oklch(51.8%_0.253_323.949)]/6 animate-ping" style={{ animationDuration: "10s", animationDelay: "2s" }} />
      
      {/* Uçuşan toz partikülleri - küçük ışık noktaları */}
      <div className="absolute top-[20%] left-[15%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/30 animate-float" style={{ animationDuration: "12s" }} />
      <div className="absolute top-[30%] left-[70%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/25 animate-float" style={{ animationDuration: "15s", animationDelay: "1s" }} />
      <div className="absolute top-[60%] left-[20%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/20 animate-float" style={{ animationDuration: "10s", animationDelay: "2s" }} />
      <div className="absolute top-[70%] left-[80%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/30 animate-float" style={{ animationDuration: "14s", animationDelay: "0.5s" }} />
      <div className="absolute top-[40%] left-[40%] w-0.5 h-0.5 rounded-full bg-[oklch(51.8%_0.253_323.949)]/35 animate-float" style={{ animationDuration: "8s", animationDelay: "3s" }} />
      <div className="absolute top-[50%] left-[60%] w-0.5 h-0.5 rounded-full bg-[oklch(51.8%_0.253_323.949)]/25 animate-float" style={{ animationDuration: "11s", animationDelay: "1.5s" }} />
      <div className="absolute top-[25%] left-[50%] w-0.5 h-0.5 rounded-full bg-[oklch(51.8%_0.253_323.949)]/20 animate-float" style={{ animationDuration: "9s", animationDelay: "4s" }} />
      <div className="absolute top-[75%] left-[30%] w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]/15 animate-float" style={{ animationDuration: "13s", animationDelay: "2.5s" }} />
      <div className="absolute top-[15%] left-[85%] w-0.5 h-0.5 rounded-full bg-[oklch(51.8%_0.253_323.949)]/30 animate-float" style={{ animationDuration: "16s", animationDelay: "1s" }} />
      <div className="absolute top-[85%] left-[10%] w-0.5 h-0.5 rounded-full bg-[oklch(51.8%_0.253_323.949)]/20 animate-float" style={{ animationDuration: "7s", animationDelay: "3.5s" }} />
      
      {/* Kenar karartmaları - içeri doğru fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-transparent to-[#0A0A0F] opacity-60" />
      
      {/* Köşe karartmaları */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#0A0A0F] to-transparent rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0A0A0F] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#0A0A0F] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#0A0A0F] to-transparent rounded-full blur-3xl" />
    </div>
  );
}