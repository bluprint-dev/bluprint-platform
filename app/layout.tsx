import type { Metadata } from "next";
import { Sora } from "next/font/google";
import Providers from "./providers";
import Background from "./components/Background";
import Sidebar from "./components/Sidebar";
import MarqueeBanner from "./components/MarqueeBanner";
import ChatbaseEmbed from "./components/ChatbaseEmbed";
import "./globals.css";

const sora = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BluPrint - Solana Meme Coin Launchpad",
  description: "Create your own Solana meme coin in 10 seconds.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BluPrint - Solana Meme Coin Launchpad",
    description: "Create your own Solana meme coin in 10 seconds.",
    url: "https://bluprint.fun",
    siteName: "BluPrint",
    images: [{ url: "https://bluprint.fun/favicon.ico", width: 256, height: 256 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BluPrint - Solana Meme Coin Launchpad",
    description: "Create your own Solana meme coin in 10 seconds.",
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
    <html lang="en" suppressHydrationWarning>
      <body className={sora.className}>
        <Providers>
          <Background />
          
          <div className="fixed top-0 left-0 right-0 z-10">
            <MarqueeBanner />
          </div>
          
          <div className="fixed top-10 left-0 bottom-0 z-20">
            <Sidebar />
          </div>
          
          <main className="md:ml-56 pt-14 min-h-screen">
            {children}
          </main>

          {/* AI Chatbot - Chatbase */}
          <ChatbaseEmbed />
        </Providers>
      </body>
    </html>
  );
}