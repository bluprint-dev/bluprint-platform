"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useI18n } from "../lib/i18n-provider";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  Home,
  Sparkles,
  LineChart,
  Users,
  Radio,
  Trophy,
  Wallet,
  X,
  Menu,
  TrendingUp,
} from "lucide-react";

export default function Sidebar() {
  const { t } = useI18n();
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // New Pairs kaldırıldı - sadece ana menü item'ları
  const menuItems = [
    { href: "/", label: t("nav_home"), icon: Home, comingSoon: false },
    { href: "/create", label: t("nav_create"), icon: Sparkles, comingSoon: false },
    { href: "/dex", label: "BluPrint DEX", icon: LineChart, comingSoon: false },
    { href: "/referral", label: t("nav_refer"), icon: Users, comingSoon: false },
    { href: "/live", label: t("nav_live"), icon: Radio, comingSoon: false },
    { href: "/top-users", label: t("nav_top_users"), icon: Trophy, comingSoon: false },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWalletClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const isActive = (href: string) => pathname === href;

  const sidebarContent = (
    <>
      {/* Logo - Whale Theme */}
      <div className="px-4 py-5 border-b border-[#233554] bg-[#020C1A]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#64FFDA] to-[#0A192F] rounded-xl flex items-center justify-center shadow-lg shadow-[#64FFDA]/20 overflow-hidden border border-[#64FFDA]/30 group-hover:scale-105 transition-transform duration-300">
            <img 
              src="/favicon.ico" 
              alt="BluPrint" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight group-hover:text-[#64FFDA] transition-colors duration-300">
              {t("sidebar_bluprint")}
            </span>
            <p className="text-[10px] text-[#64FFDA] -mt-1 font-medium">Whale Launchpad</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <div key={item.href} className="relative">
              {item.comingSoon ? (
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[#8892B0] bg-[#1A365D]/20 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 opacity-50" />
                    <span className="text-sm font-medium opacity-50">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-bold bg-[#1A365D] text-[#64FFDA] px-1.5 py-0.5 rounded-full border border-[#64FFDA]/30">
                    SOON
                  </span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active
                      ? "bg-[#1A365D] text-white border-l-2 border-[#64FFDA]"
                      : "text-[#8892B0] hover:text-white hover:bg-[#1A365D]/30"
                  }`}
                >
                  <Icon 
                    className={`w-5 h-5 transition-all duration-200 ${
                      active 
                        ? "text-[#64FFDA] drop-shadow-[0_0_2px_rgba(100,255,218,0.5)]" 
                        : "text-[#8892B0] group-hover:text-[#64FFDA]"
                    }`} 
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-[#64FFDA] shadow-lg shadow-[#64FFDA]/50"
                      transition={{ type: "spring", duration: 0.3 }}
                    />
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Alt kısım - Statü göstergesi */}
      <div className="px-3 pt-2 pb-5 space-y-3 border-t border-[#233554] mt-auto">
        {/* Network Status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#020C1A]/50 border border-[#233554]">
          <div className="w-2 h-2 rounded-full bg-[#64FFDA] animate-pulse" />
          <span className="text-xs text-[#8892B0]">Solana Mainnet</span>
          <TrendingUp className="w-3 h-3 text-[#64FFDA] ml-auto" />
        </div>

        {/* Wallet Button */}
        <button
          onClick={handleWalletClick}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1A365D]/30 border border-[#64FFDA]/30 hover:bg-[#1A365D] hover:border-[#64FFDA] transition-all duration-200 group"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-[#64FFDA] to-[#4ECDC4] rounded-full flex items-center justify-center">
            <Wallet className="w-3 h-3 text-[#0A192F]" />
          </div>
          <span className="text-white text-sm font-medium truncate">
            {connected && publicKey ? shortenAddress(publicKey.toString()) : t("nav_connect")}
          </span>
          {connected && (
            <span className="ml-auto w-2 h-2 bg-[#64FFDA] rounded-full animate-pulse shadow-lg shadow-[#64FFDA]/50" />
          )}
        </button>
        
        {/* Theme & Language */}
        <div className="flex items-center justify-between gap-2 px-1 pt-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#0A192F] border-r border-[#233554] z-40 hidden md:flex flex-col shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-[#0A192F]/95 backdrop-blur-xl border-b border-[#233554]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-[#64FFDA] to-[#0A192F] rounded-xl flex items-center justify-center overflow-hidden border border-[#64FFDA]/30">
              <img src="/favicon.ico" alt="BluPrint" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-lg group-hover:text-[#64FFDA] transition-colors">
              {t("sidebar_bluprint")}
            </span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-[#1A365D]/30 flex items-center justify-center active:scale-95 transition-all duration-200 hover:bg-[#1A365D] hover:border-[#64FFDA]/30 border border-transparent"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
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
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0A192F] z-50 shadow-2xl flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}