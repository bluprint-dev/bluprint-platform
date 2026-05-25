import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Sidebar from "./components/Sidebar";
import Background3D from "./components/3D/Background3D";
import MarqueeBanner from "./components/MarqueeBanner";
import ChatbaseEmbed from "./components/ChatbaseEmbed";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const space = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space",
  display: "swap",
});

const mono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BluPrint - Pink Whale Launchpad",
  description: "Launch your meme coin on Solana in seconds. No code. No friction. Just pink power.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BluPrint - Pink Whale Launchpad",
    description: "Launch your meme coin on Solana in seconds.",
    url: "https://bluprint.fun",
    siteName: "BluPrint",
    images: [{ url: "https://bluprint.fun/favicon.ico", width: 256, height: 256 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BluPrint - Pink Whale Launchpad",
    description: "Launch your meme coin on Solana in seconds.",
    images: ["https://bluprint.fun/favicon.ico"],
    creator: "@bluprint",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${space.variable} ${mono.variable} antialiased bg-[#0A0A0F]`}>
        <Providers>
          {/* 3D Arkaplan - En arkada */}
          <Background3D />
          
          {/* Üst Banner - Sabit */}
          <div className="fixed top-0 left-0 right-0 z-20">
            <MarqueeBanner />
          </div>
          
          {/* Sidebar - Sol tarafta */}
          <div className="fixed top-9 left-0 bottom-0 z-30">
            <Sidebar />
          </div>
          
          {/* Ana İçerik */}
          <main className="md:ml-56 pt-14 min-h-screen relative z-10">
            {children}
          </main>

          {/* AI Chatbot - Sağ alt köşe */}
          <ChatbaseEmbed />
        </Providers>
      </body>
    </html>
  );
}