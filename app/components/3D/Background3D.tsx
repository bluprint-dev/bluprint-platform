"use client";

import { useState, useEffect } from "react";
import Spline from "@splinetool/react-spline";

export default function Background3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Spline
        scene="https://prod.spline.design/453d7aa6-c536-4598-a5dc-ac35a1d4af1d/scene.splinecode"
        style={{
          width: "100%",
          height: "100%",
          opacity: 0.25,
          transform: "scale(1.2)",
        }}
      />
    </div>
  );
}