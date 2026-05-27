"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-white mb-4">About BluPrint</h1>
      <p className="text-gray-400 leading-relaxed mb-8">
        BluPrint is a fair-launch Solana meme coin launchpad. Create tokens in seconds,
        trade instantly on bonding curves, and migrate to Raydium when the curve fills.
      </p>
      <Link
        href="/create"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-bold hover:shadow-lg hover:shadow-[#ff2d95]/20 transition"
      >
        <Rocket className="w-4 h-4" />
        Launch a token
      </Link>
    </div>
  );
}
