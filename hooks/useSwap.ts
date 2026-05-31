import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useToast } from "@/app/components/ToastProvider";

// ✅ genesisAccount ve mint ayrı alanlar
export type SwapInput = {
  genesisAccount: string; // Metaplex Genesis launch account
  mint: string;           // SPL token mint (display only)
  amount: string;         // SOL (buy) veya token miktarı (sell)
  isBuy: boolean;
};

export function useSwap() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { showToast } = useToast();

  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState("");

  const swap = useCallback(
    async (input: SwapInput) => {
      if (!connected || !publicKey) {
        window.dispatchEvent(new CustomEvent("wallet-connect-requested"));
        return false;
      }

      setIsSwapping(true);
      setError("");

      try {
        const amount = input.isBuy
          ? Math.floor(Number(input.amount) * 1_000_000_000).toString()
          : input.amount;

        const res = await fetch("/api/bonding-curve/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genesisAccount: input.genesisAccount,
            mintAddress: input.mint,
            amount,
            userPublicKey: publicKey.toString(),
            isBuy: input.isBuy,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error ?? "SWAP_FAILED");
        }

        // ✅ FIX: Umi versioned transaction üretiyor, Transaction.from() değil
        // VersionedTransaction.deserialize() kullanılmalı
        const tx = VersionedTransaction.deserialize(
          Buffer.from(data.transaction, "base64")
        );

        const sig = await sendTransaction(tx, connection);

        await connection.confirmTransaction(sig, "confirmed");

        showToast(
          input.isBuy ? "Buy successful!" : "Sell successful!",
          "success"
        );

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Swap failed";
        setError(msg);
        showToast(msg, "error");
        return false;
      } finally {
        setIsSwapping(false);
      }
    },
    [connected, publicKey, sendTransaction, connection, showToast]
  );

  return { swap, isSwapping, error, setError };
}