"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff2d95]/20 to-[#ff6bcb]/20 blur-xl opacity-0 group-focus-within:opacity-100 transition" />
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name, symbol, or mint..."
          className="w-full h-12 pl-11 pr-11 rounded-2xl bg-[#12121A] border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#ff2d95]/50 transition"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
