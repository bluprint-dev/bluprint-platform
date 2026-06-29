import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import LayoutShell from "./components/LayoutShell";

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
  title: "BluPrint – #1 Solana Launchpad",
  description: "The fastest algorithmic bonding curve launchpad on Solana. Launch, trade, and migrate to Raydium in seconds.",
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
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}