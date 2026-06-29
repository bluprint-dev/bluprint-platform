"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MarqueeBanner from "./MarqueeBanner";
import ChatbaseEmbed from "./ChatbaseEmbed";
import Footer from "./Footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComingSoon = pathname === "/x";
  if (isComingSoon) return <>{children}</>;

  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20 }}>
        <MarqueeBanner />
      </div>
      <Sidebar />
      <main
        className="md:ml-56 site-main"
        style={{ minHeight: "100vh", paddingTop: 36, position: "relative", zIndex: 10, display: "flex", flexDirection: "column" }}
      >
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </main>
      <ChatbaseEmbed />
    </>
  );
}