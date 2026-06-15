"use client";

import { ThemeProvider } from "next-themes";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { TrustWalletAdapter } from "@solana/wallet-adapter-trust";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ToastProvider from "./components/ToastProvider";
import I18nProvider from "./lib/i18n-provider";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(),
    ],
    []
  );

  const endpoint = process.env.NEXT_PUBLIC_RPC_URL!;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider
          endpoint={endpoint}
          config={{ commitment: "confirmed", wsEndpoint: endpoint.replace("https", "wss") }}
        >
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                <ToastProvider>{children}</ToastProvider>
              </ThemeProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}