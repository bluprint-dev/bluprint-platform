"use client";

import Link from "next/link";
import { Twitter, MessageCircle, Mail, ArrowUpRight, Sparkles } from "lucide-react";

const F = {
  display: "var(--font-outfit), 'Outfit', sans-serif",
  mono: "var(--font-mono), 'Space Mono', monospace",
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-[420px] w-[420px] rounded-full bg-[#9945FF]/10 blur-[120px]" />
          <div className="absolute top-[10%] right-10 h-[360px] w-[360px] rounded-full bg-[#14F195]/8 blur-[140px]" />
          <div className="absolute bottom-[-20%] left-[35%] h-[420px] w-[420px] rounded-full bg-[#9945FF]/8 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,rgba(153,69,255,0.7)_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Brand */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-3">
                <img
                  src="/favicon.ico"
                  alt="BluPrint"
                  className="w-9 h-9 object-contain"
                  style={{ filter: "drop-shadow(0 0 10px rgba(153,69,255,0.5))" }}
                />
                <div>
                  <div className="flex items-baseline" style={{ fontFamily: F.display, fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
                    <span className="text-white">Blu</span>
                    <span style={{ color: "#9945FF", textShadow: "0 0 12px rgba(153,69,255,0.6)" }}>Print</span>
                  </div>
                  <div className="text-white/30" style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.08em" }}>
                    SOLANA BONDING-CURVE LAUNCHPAD
                  </div>
                </div>
              </div>

              <p className="text-sm text-white/40 leading-relaxed max-w-md" style={{ fontFamily: F.display }}>
                Solana&apos;s fastest bonding-curve launchpad — built for instant deploys, automated Raydium migrations and zero admin keys.
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm font-semibold transition hover:brightness-110"
                  style={{
                    fontFamily: F.display,
                    background: "linear-gradient(135deg,#14F195,#0fa96a)",
                    color: "#07070f",
                    boxShadow: "0 0 28px rgba(20,241,149,0.25)",
                  }}
                >
                  Launch token
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dex"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm transition hover:bg-[rgba(153,69,255,0.14)]"
                  style={{
                    fontFamily: F.display,
                    background: "rgba(153,69,255,0.08)",
                    border: "1px solid rgba(153,69,255,0.32)",
                    color: "rgba(153,69,255,0.9)",
                  }}
                >
                  Open DEX
                </Link>
              </div>
            </div>

            {/* Link columns */}
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <h4 className="text-white/35 font-bold uppercase" style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em" }}>Platform</h4>
                <ul className="space-y-2">
                  <li><Link href="/create" className="footer-link text-sm" style={{ fontFamily: F.display }}>Create</Link></li>
                  <li><Link href="/dex" className="footer-link text-sm" style={{ fontFamily: F.display }}>DEX</Link></li>
                  <li><Link href="/referral" className="footer-link text-sm" style={{ fontFamily: F.display }}>Referral</Link></li>
                  <li><Link href="/kol-rewards" className="footer-link text-sm" style={{ fontFamily: F.display }}>KOL Rewards</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-white/35 font-bold uppercase" style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em" }}>Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="footer-link text-sm" style={{ fontFamily: F.display }}>Privacy</Link></li>
                  <li><Link href="/terms" className="footer-link text-sm" style={{ fontFamily: F.display }}>Terms</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-white/35 font-bold uppercase" style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em" }}>Social</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://x.com/BluprintFun" target="_blank" rel="noopener noreferrer" className="footer-link text-sm inline-flex items-center gap-2" style={{ fontFamily: F.display }}>
                      <Twitter className="w-4 h-4" /> X
                    </a>
                  </li>
                  <li>
                    <Link href="/" className="footer-link text-sm inline-flex items-center gap-2" style={{ fontFamily: F.display }}>
                      <MessageCircle className="w-4 h-4" /> Telegram
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-white/35 font-bold uppercase" style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em" }}>Contact</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="mailto:hello@bluprint.fun" className="footer-link text-sm inline-flex items-center gap-2" style={{ fontFamily: F.display }}>
                      <Mail className="w-4 h-4" />
                      hello@bluprint.fun
                    </a>
                  </li>
                  <li className="text-xs text-white/30 inline-flex items-center gap-2" style={{ fontFamily: F.display }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "#9945FF" }} />
                    Built for mainnet speed
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/30" style={{ fontFamily: F.mono }}>
              © {currentYear} BluPrint Protocol. All rights reserved.
            </div>
            <div className="text-[10px] text-white/20" style={{ fontFamily: F.mono, letterSpacing: "0.08em" }}>
              SOLANA MAINNET · BONDING CURVE · ZERO ADMIN KEYS
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link {
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: #14F195;
        }
      `}</style>
    </footer>
  );
}