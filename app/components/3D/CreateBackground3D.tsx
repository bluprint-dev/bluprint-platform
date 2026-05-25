"use client";

import { useState, useEffect } from "react";
import Spline from "@splinetool/react-spline";

export default function CreateBackground3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Spline
        scene="https://prod.spline.design/8eee6c24-b78e-4c61-8cf9-22de12f71f58/scene.splinecode"
        style={{
          width: "100%",
          height: "100%",
          opacity: 0.2,
          transform: "scale(1.1)",
        }}
      />
    </div>
  );
}