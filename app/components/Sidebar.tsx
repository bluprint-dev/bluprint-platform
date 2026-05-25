"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Home,
  Sparkles,
  LineChart,
  Users,
  Radio,
  Trophy,
  Wallet,
} from "lucide-react";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const isActive = (href: string) => pathname === href;

  if (!mounted) return null;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#131316] border-r border-[#22222A] z-40 hidden md:flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#22222A]">
        <Link href="/" className="flex items-baseline gap-0">
          <span className="text-white font-black text-xl tracking-tight">Blu</span>
          <span className="text-[oklch(51.8%_0.253_323.949)] font-black text-xl tracking-tight">Print</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-[#1A1A1F] text-[oklch(51.8%_0.253_323.949)]"
                  : "text-[#8A8A99] hover:bg-[#1A1A1F] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="activeDot"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[oklch(51.8%_0.253_323.949)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="px-3 pb-5 border-t border-[#22222A] pt-4">
        <button
          onClick={() => (connected ? disconnect() : setVisible(true))}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1A1A1F] border border-[#22222A] hover:border-[oklch(51.8%_0.253_323.949)] transition-all"
        >
          <Wallet className="w-4 h-4 text-[oklch(51.8%_0.253_323.949)]" />
          <span className="text-white text-sm truncate">
            {connected && publicKey ? shortenAddress(publicKey.toString()) : "Connect Wallet"}
          </span>
          {connected && <span className="ml-auto w-2 h-2 bg-[oklch(51.8%_0.253_323.949)] rounded-full" />}
        </button>
      </div>
    </aside>
  );
}