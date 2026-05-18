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

export default function Sidebar() {
  const { t } = useI18n();
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menuItems = [
    { href: "/", label: t("nav_home"), icon: "🏠" },
    { href: "/create", label: t("nav_create"), icon: "🪙" },
    { href: "/new-pairs", label: t("nav_new_pairs"), icon: "🔥" },
    { href: "/referral", label: t("nav_refer"), icon: "💰" },
    { href: "/live", label: t("nav_live"), icon: "📢" },
    { href: "/top-users", label: t("nav_top_users"), icon: "🏆" },
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
      <div className="px-4 py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 overflow-hidden">
            <img 
              src="/favicon.ico" 
              alt="BluPrint" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">{t("sidebar_bluprint")}</span>
            <p className="text-[10px] text-gray-500 -mt-1">{t("sidebar_launchpad")}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
              isActive(item.href)
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
            {isActive(item.href) && (
              <motion.div
                layoutId="activeIndicator"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-lg"
                transition={{ type: "spring", duration: 0.3 }}
              />
            )}
          </Link>
        ))}
      </nav>

      <div className="px-3 pt-2 pb-4 space-y-2.5">
        <button
          onClick={handleWalletClick}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-green-600/20 to-green-500/10 border border-green-500/30 hover:from-green-600/30 hover:to-green-500/20 transition-all duration-200"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-gray-200 text-sm font-medium truncate">
            {connected && publicKey ? shortenAddress(publicKey.toString()) : t("nav_connect")}
          </span>
          {connected && (
            <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </button>
        
        <div className="flex items-center justify-between gap-2 px-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );

  if (!mounted) return null;

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 z-40 hidden md:flex flex-col">
        {sidebarContent}
      </aside>

      <div className="fixed top-0 left-0 right-0 z-30 md:hidden bg-gray-900/95 backdrop-blur-xl border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/favicon.ico" alt="BluPrint" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-lg">{t("sidebar_bluprint")}</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center active:scale-95 transition"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 z-50 md:hidden shadow-2xl flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}