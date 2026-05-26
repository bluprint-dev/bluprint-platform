"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Home,
  Sparkles,
  LineChart,
  Users,
  Wallet,
  X,
  Menu,
  Zap,
} from "lucide-react";

export default function Sidebar() {
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/create", label: "Create", icon: Sparkles },
    { href: "/dex", label: "DEX", icon: LineChart },
    { href: "/referral", label: "Refer", icon: Users },
  ];

  useEffect(() => setMounted(true), []);

  const handleWalletClick = () => {
    if (connected) disconnect();
    else setVisible(true);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const isActive = (href: string) => pathname === href;

  const sidebarContent = (
    <>
      {/* Arkaplan */}
      <div className="absolute inset-0 bg-[#050507] backdrop-blur-2xl" />
      
      {/* Glow orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#ff2d95]/10 blur-3xl" />
      <div className="absolute bottom-20 left-0 w-40 h-40 rounded-full bg-[#7c3aed]/5 blur-3xl" />
      
      {/* Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ff2d95 1px, transparent 1px),
            linear-gradient(to bottom, #ff2d95 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* İçerik */}
      <div className="relative z-10 flex flex-col h-full">
        
        {/* Live Pulse */}
        <div className="px-3 pt-5 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101014]/50 border border-[#ff2d95]/15">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-zinc-400">Solana Mainnet Live</span>
            <Zap className="w-3 h-3 text-[#ff2d95] ml-auto" />
          </div>
        </div>
        
        {/* Logo */}
        <div className="px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="BluPrint" className="w-7 h-7" />
            <div className="flex">
              <span className="text-white font-bold text-lg">Blu</span>
              <span className="text-[#ff2d95] font-bold text-lg">Print</span>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isHovered = hoveredItem === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-[#ff2d95]/15 to-[#7c3aed]/10 border border-[#ff2d95]/25"
                    : "text-[#8E8E93] hover:bg-[#1A1A22]/50 hover:translate-x-1"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#ff2d95] to-[#7c3aed]" />
                )}
                
                <Icon className={`w-5 h-5 ${active ? "text-[#ff2d95]" : "text-[#8E8E93] group-hover:text-[#ff2d95]"}`} />
                
                <span className={`text-sm font-medium ${active ? "text-white" : "text-[#8E8E93]"}`}>
                  {item.label}
                </span>
                
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff2d95]" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Wallet */}
        <div className="px-3 pt-2 pb-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1A1A22] to-[#101014] border border-[#ff2d95]/15" />
            
            <button
              onClick={handleWalletClick}
              className="relative w-full flex items-center gap-2 px-3 py-3 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#7c3aed] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1 text-left">
                <p className="text-xs text-zinc-400">Wallet</p>
                <p className="text-white text-sm font-medium truncate">
                  {connected && publicKey ? shortenAddress(publicKey.toString()) : "Connect Wallet"}
                </p>
              </div>
              
              {connected && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400">Live</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (!mounted) return null;

  return (
    <>
      {/* Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-56 z-40 hidden md:flex flex-col overflow-hidden">
        <div className="relative flex flex-col h-full">{sidebarContent}</div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-[#050507]/95 backdrop-blur-2xl border-b border-[#ff2d95]/15">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="BluPrint" className="w-7 h-7" />
            <div className="flex">
              <span className="text-white font-bold text-lg">Blu</span>
              <span className="text-[#ff2d95] font-bold text-lg">Print</span>
            </div>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-[#1A1A22]/50 border border-[#ff2d95]/20 flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              className="fixed left-0 top-0 bottom-0 w-56 z-50 shadow-2xl"
            >
              <div className="relative flex flex-col h-full">{sidebarContent}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}