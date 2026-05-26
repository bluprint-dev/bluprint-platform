"use client";

import Link from "next/link";
import { Github, Twitter, MessageCircle, Rocket, Shield, FileText, Scale, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 text-gray-500 text-sm border-t border-white/5 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Ana footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo ve açıklama */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#ff2d95]" />
              <span className="text-white font-bold">BluPrint</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Launch your meme coin in seconds on Solana. No code. No friction. Just launch.
            </p>
          </div>
          
          {/* Platform */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/create" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">Create Token</Link></li>
              <li><Link href="/dex" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">DEX Trading</Link></li>
              <li><Link href="/referral" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">Referral Program</Link></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">Documentation</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">GitHub</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">Audit Report</a></li>
            </ul>
          </div>
          
          {/* Legal & Social */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-xs text-gray-600 hover:text-[#ff2d95] transition">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Alt bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-700">© {currentYear} BluPrint. All rights reserved.</span>
            <span className="text-[10px] text-gray-700">Built on Solana 🟣</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-600 hover:text-[#ff2d95] transition">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-600 hover:text-[#ff2d95] transition">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-600 hover:text-[#ff2d95] transition">
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href="mailto:hello@bluprint.fun" className="text-gray-600 hover:text-[#ff2d95] transition">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}