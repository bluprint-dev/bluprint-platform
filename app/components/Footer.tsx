"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#22222A] py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#8A8A99]">
          <div className="flex items-center gap-1">
            <span>© 2024</span>
            <span className="text-white font-medium">Blu</span>
            <span className="text-[oklch(51.8%_0.253_323.949)] font-medium">Print</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}