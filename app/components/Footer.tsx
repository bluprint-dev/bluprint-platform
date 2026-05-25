import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#252525] py-8 mt-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#8E8E93]">
          <div>
            <span>© 2024 </span>
            <span className="text-white">Blu</span>
            <span className="text-[oklch(51.8%_0.253_323.949)]">Print</span>
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