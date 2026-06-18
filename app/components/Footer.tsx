"use client";

import Link from "next/link";
import { Twitter, MessageCircle, Rocket, Mail, ArrowUpRight, Sparkles } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-[420px] w-[420px] rounded-full bg-[#ff2d95]/10 blur-[120px]" />
          <div className="absolute top-[10%] right-10 h-[360px] w-[360px] rounded-full bg-[#7c3aed]/10 blur-[140px]" />
          <div className="absolute bottom-[-20%] left-[35%] h-[420px] w-[420px] rounded-full bg-[#ff6bcb]/10 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,rgba(255,45,149,0.7)_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#ff2d95]/30 blur-lg" />
                  <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff2d95] to-[#ff6bcb] flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-white font-black tracking-tight text-lg">BluPrint</div>
                  <div className="text-[10px] text-gray-500 font-mono">pink whale launchpad</div>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                Launch, trade and grow on Solana with a pump-style bonding curve experience — built for speed, clarity and aesthetics.
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white text-sm font-semibold shadow-[0_0_35px_rgba(255,45,149,0.22)] hover:shadow-[0_0_55px_rgba(255,45,149,0.32)] transition"
                >
                  Launch token
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dex"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl border border-white/10 bg-white/5 text-gray-200 text-sm hover:border-[#ff2d95]/40 hover:text-white transition"
                >
                  Open DEX
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Platform</h4>
                <ul className="space-y-2">
                  <li><Link href="/create" className="text-sm text-gray-400 hover:text-[#ff2d95] transition">Create</Link></li>
                  <li><Link href="/dex" className="text-sm text-gray-400 hover:text-[#ff2d95] transition">DEX</Link></li>
                  <li><Link href="/referral" className="text-sm text-gray-400 hover:text-[#ff2d95] transition">Referral</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-[#ff2d95] transition">Privacy</Link></li>
                  <li><Link href="/terms" className="text-sm text-gray-400 hover:text-[#ff2d95] transition">Terms</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Social</h4>
                <ul className="space-y-2">
                  <li><a href="https://x.com/BluprintFun" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[#ff2d95] transition inline-flex items-center gap-2"><Twitter className="w-4 h-4" /> X</a></li>
                  <li><Link href="/" className="text-sm text-gray-400 hover:text-[#ff2d95] transition inline-flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Telegram</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Contact</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="mailto:hello@bluprint.fun" className="text-sm text-gray-400 hover:text-[#ff2d95] transition inline-flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      hello@bluprint.fun
                    </a>
                  </li>
                  <li className="text-xs text-gray-500 inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff2d95]" />
                    Built for mainnet speed
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              © {currentYear} BluPrint. All rights reserved.
            </div>
            <div className="text-[10px] text-gray-600 font-mono">
              Solana · Bonding Curve · Pink Whale Theme
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}