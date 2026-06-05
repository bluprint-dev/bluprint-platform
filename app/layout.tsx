import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Sidebar from "./components/Sidebar";
import MarqueeBanner from "./components/MarqueeBanner";
import ChatbaseEmbed from "./components/ChatbaseEmbed";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BluPrint - Pink Whale Launchpad",
  description: "Launch your meme coin on Solana in seconds.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${mono.variable} antialiased`}
        style={{ margin: 0, padding: 0, background: "#0A0A0F", color: "#fff", fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
      >
        <Providers>
          {/* MarqueeBanner — fixed top */}
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20 }}>
            <MarqueeBanner />
          </div>

          {/* Sidebar — fixed left, desktop only */}
          <div
            className="hidden md:block"
            style={{ position: "fixed", left: 0, top: 36, bottom: 0, width: 224, zIndex: 30 }}
          >
            <Sidebar />
          </div>

          {/* Main content */}
          <main
            className="md:ml-56"
            style={{ minHeight: "100vh", paddingTop: 36, position: "relative", zIndex: 10 }}
          >
            {children}
          </main>

          <ChatbaseEmbed />
        </Providers>
      </body>
    </html>
  );
}