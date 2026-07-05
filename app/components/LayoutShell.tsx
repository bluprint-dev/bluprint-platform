"use client";
import { usePathname } from "next/navigation";
import MarqueeBanner from "./MarqueeBanner";
import ChatbaseEmbed from "./ChatbaseEmbed";
import Footer from "./Footer";
import Navbar from "@/components/Navbar";

const MARQUEE_HEIGHT = 36;

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComingSoon = pathname === "/x";
  if (isComingSoon) return <>{children}</>;

  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20 }}>
        <MarqueeBanner />
      </div>
      <Navbar topOffset={MARQUEE_HEIGHT} />
      <main
        className="site-main"
        style={{ minHeight: "100vh", paddingTop: 8, position: "relative", zIndex: 10, display: "flex", flexDirection: "column" }}
      >
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </main>
      <ChatbaseEmbed />
    </>
  );
}