"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Home, Sparkles, LineChart, Users, Wallet, X, Menu, Zap } from "lucide-react";

const F = {
  display: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
  mono: "'Space Mono', 'JetBrains Mono', monospace",
};

const menuItems = [
  { href: "/",        label: "Home",   icon: Home      },
  { href: "/create",  label: "Create", icon: Sparkles  },
  { href: "/dex",     label: "DEX",    icon: LineChart  },
  { href: "/referral",label: "Refer",  icon: Users     },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "linear-gradient(180deg, #080412 0%, #0d0619 60%, #080412 100%)",
      borderRight: "1px solid rgba(153,69,255,0.12)",
      overflow: "hidden",
    }}>
      {/* ambient blobs */}
      <div style={{ position: "absolute", top: -40, left: -20, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(153,69,255,0.12) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 60, left: -10, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,241,149,0.06) 0%, transparent 70%)", filter: "blur(24px)", pointerEvents: "none" }} />

      {/* grid texture */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.025, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(153,69,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(153,69,255,1) 1px,transparent 1px)",
        backgroundSize: "32px 32px" }} />

      {/* content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>

        {/* live badge */}
        <div style={{ padding: "16px 12px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(20,241,149,0.12)" }}>
            <span style={{ position: "relative", display: "flex", width: 7, height: 7, flexShrink: 0 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(20,241,149,0.6)", animation: "sbPing 1.6s ease-out infinite" }} />
              <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#14F195" }} />
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(20,241,149,0.7)", flex: 1 }}>SOLANA MAINNET</span>
            <Zap size={11} color="#9945FF" />
          </div>
        </div>

        {/* logo */}
        <div style={{ padding: "12px 16px 16px" }}>
          <Link href="/" onClick={onLinkClick} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/favicon.ico" alt="BluPrint" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(153,69,255,0.5))" }} />
            <div style={{ display: "flex", fontFamily: F.display, fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#fff" }}>Blu</span>
              <span style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Print</span>
            </div>
          </Link>
        </div>

        {/* divider */}
        <div style={{ height: 1, margin: "0 12px 8px", background: "linear-gradient(90deg,transparent,rgba(153,69,255,0.2),transparent)" }} />

        {/* nav */}
        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onLinkClick}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  background: active ? "linear-gradient(135deg,rgba(153,69,255,0.14),rgba(20,241,149,0.05))" : "transparent",
                  border: active ? "1px solid rgba(153,69,255,0.22)" : "1px solid transparent",
                }}>
                {/* active indicator */}
                {active && (
                  <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, borderRadius: "0 2px 2px 0", background: "linear-gradient(180deg,#9945FF,#14F195)" }} />
                )}
                <Icon size={17} color={active ? "#9945FF" : "rgba(255,255,255,0.3)"} />
                <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: active ? 700 : 500, color: active ? "#fff" : "rgba(255,255,255,0.38)", letterSpacing: "-0.01em" }}>
                  {item.label}
                </span>
                {active && (
                  <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 8px #14F195" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* divider */}
        <div style={{ height: 1, margin: "0 12px 12px", background: "linear-gradient(90deg,transparent,rgba(153,69,255,0.15),transparent)" }} />

        {/* wallet */}
        <div style={{ padding: "0 10px 20px" }}>
          <button
            onClick={() => { connected ? disconnect() : setVisible(true); onLinkClick?.(); }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 14,
              background: connected ? "rgba(20,241,149,0.05)" : "rgba(153,69,255,0.08)",
              border: connected ? "1px solid rgba(20,241,149,0.18)" : "1px solid rgba(153,69,255,0.22)",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "left",
            }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: connected ? "linear-gradient(135deg,rgba(20,241,149,0.2),rgba(153,69,255,0.2))" : "linear-gradient(135deg,rgba(153,69,255,0.2),rgba(20,241,149,0.1))", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${connected ? "rgba(20,241,149,0.2)" : "rgba(153,69,255,0.2)"}` }}>
              <Wallet size={14} color={connected ? "#14F195" : "#9945FF"} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)" }}>WALLET</p>
              <p style={{ margin: "2px 0 0", fontFamily: F.display, fontSize: 12, fontWeight: 600, color: connected ? "#14F195" : "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {connected && publicKey ? shortenAddress(publicKey.toString()) : "Connect Wallet"}
              </p>
            </div>
            {connected && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14F195", boxShadow: "0 0 6px #14F195" }} />
              </div>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sbPing { 0%{transform:scale(1);opacity:0.8} 75%{transform:scale(2.5);opacity:0} 100%{transform:scale(1);opacity:0} }
      `}</style>
    </div>
  );
}

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      {/* Desktop */}
      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 224, zIndex: 40, display: "none" }} className="md:block">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, background: "rgba(8,4,18,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(153,69,255,0.12)" }} className="md:hidden">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/favicon.ico" alt="BluPrint" style={{ width: 26, height: 26, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(153,69,255,0.5))" }} />
            <div style={{ display: "flex", fontFamily: F.display, fontSize: 17, fontWeight: 900 }}>
              <span style={{ color: "#fff" }}>Blu</span>
              <span style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Print</span>
            </div>
          </Link>
          <button onClick={() => setIsMobileOpen(!isMobileOpen)}
            style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {isMobileOpen ? <X size={18} color="#fff" /> : <Menu size={18} color="#fff" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 50 }} className="md:hidden" />
            <motion.div initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 224, zIndex: 60 }} className="md:hidden">
              <SidebarContent onLinkClick={() => setIsMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}