import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import LayoutShell from "./components/LayoutShell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit", // İSİM AYNI KALDI: LayoutShell/Sidebar gibi eski dosyalar --font-outfit'i referans alıyor olabilir, o yüzden değişkeni yeniden adlandırmadım. Sadece font'u Space Grotesk yaptım.
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
        className={`${spaceGrotesk.variable} ${mono.variable} antialiased`}
        style={{ margin: 0, padding: 0, background: "#0A0A0C", color: "#F2E4C2", fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
      >
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}