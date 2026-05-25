"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Home, Sparkles, LineChart, Users, Radio, Trophy, Wallet } from "lucide-react";

export default function Sidebar() {
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/create", label: "Create", icon: Sparkles },
    { href: "/dex", label: "DEX", icon: LineChart },
    { href: "/referral", label: "Refer", icon: Users },
    { href: "/live", label: "Live", icon: Radio },
    { href: "/top-users", label: "Top Users", icon: Trophy },
  ];

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => pathname === href;

  if (!mounted) return null;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#0A0A0A] border-r border-[#252525] z-40 hidden md:flex flex-col">
      {/* Logo */}
      <div className="px-5 py-7">
        <Link href="/" className="flex items-baseline gap-0">
          <span className="text-white font-semibold text-xl tracking-tight">Blu</span>
          <span className="text-[oklch(51.8%_0.253_323.949)] font-semibold text-xl tracking-tight">Print</span>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "bg-[#1C1C1E] text-[oklch(51.8%_0.253_323.949)]"
                  : "text-[#8E8E93] hover:bg-[#1C1C1E] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-[oklch(51.8%_0.253_323.949)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="px-3 py-5 border-t border-[#252525]">
        <button
          onClick={() => (connected ? disconnect() : setVisible(true))}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1C1C1E] text-sm text-white hover:opacity-80 transition"
        >
          <Wallet className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
          <span className="truncate">
            {connected && publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : "Connect"}
          </span>
          {connected && <div className="ml-auto w-2 h-2 bg-[oklch(51.8%_0.253_323.949)] rounded-full" />}
        </button>
      </div>
    </aside>
  );
}