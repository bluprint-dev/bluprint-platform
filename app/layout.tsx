import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ThemeProvider from "./providers/ThemeProvider";
import Sidebar from "./components/Sidebar";
import Background from "./components/Background";
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${space.variable} ${mono.variable} antialiased bg-white dark:bg-[#0A0A0F] text-gray-900 dark:text-white`}>
        <ThemeProvider>
          <Providers>
            {/* Kripto blockchain arkaplan - sadece dark modda göster */}
            <div className="dark:block hidden">
              <Background />
            </div>
            
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
        </ThemeProvider>
      </body>
    </html>
  );
}