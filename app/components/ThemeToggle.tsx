"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-lg transition-all ${
          theme === "light"
            ? "bg-[#ff2d95] text-white shadow-lg shadow-[#ff2d95]/25"
            : "text-gray-500 hover:text-white hover:bg-white/10"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-lg transition-all ${
          theme === "dark"
            ? "bg-[#ff2d95] text-white shadow-lg shadow-[#ff2d95]/25"
            : "text-gray-500 hover:text-white hover:bg-white/10"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-lg transition-all ${
          theme === "system"
            ? "bg-[#ff2d95] text-white shadow-lg shadow-[#ff2d95]/25"
            : "text-gray-500 hover:text-white hover:bg-white/10"
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}