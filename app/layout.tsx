import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Sidebar from "./components/Sidebar";
import Background from "./components/Background";
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
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${mono.variable} antialiased bg-[#0A0A0F] text-white`}
        style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}>
        <Providers>
          <Background />
          
          <div className="fixed top-0 left-0 right-0 z-20">
            <MarqueeBanner />
          </div>
          
          <div className="fixed top-9 left-0 bottom-0 z-30">
            <Sidebar />
          </div>
          
          <main className="md:ml-56 pt-14 min-h-screen relative z-10">
            {children}
          </main>

          <ChatbaseEmbed />
        </Providers>
      </body>
    </html>
  );
}