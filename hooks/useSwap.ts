import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { useToast } from "@/app/components/ToastProvider";

export function useSwap() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { showToast } = useToast();

  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState("");

  const swap = useCallback(
    async (input: { mint: string; amount: string; isBuy: boolean }) => {
      if (!connected || !publicKey) {
        window.dispatchEvent(new CustomEvent("wallet-connect-requested"));
        return false;
      }

      setIsSwapping(true);
      setError("");

      try {
        const lamports = Math.floor(
          Number(input.amount) * 1_000_000_000
        ).toString();

        const res = await fetch("/api/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genesisAccount: input.mint, // ✅ FIX: unified key
            amount: lamports,
            userPublicKey: publicKey.toString(),
            isBuy: input.isBuy,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        const tx = Transaction.from(
          Buffer.from(data.transaction, "base64")
        );

        const sig = await sendTransaction(tx, connection);

        await connection.confirmTransaction(sig, "confirmed");

        showToast(
          input.isBuy ? "Buy success" : "Sell success",
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