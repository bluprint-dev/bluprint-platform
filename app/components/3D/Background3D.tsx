"use client";

import { useState, useEffect } from "react";

export default function Background3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <iframe
        src="https://my.spline.design/worldplanet-XxVf76hEixRLn1Zeyf0TvP2i/"
        className="w-full h-full"
        style={{ 
          opacity: 0.2,
          transform: "scale(1.1)",
          border: "none"
        }}
        allow="autoplay; fullscreen"
        loading="lazy"
      />
    </div>
  );
}