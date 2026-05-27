import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { buildSwapTx } from "@/services/dex";
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
        const event = new CustomEvent("wallet-connect-requested");
        window.dispatchEvent(event);
        showToast("Connect your wallet to trade", "error");
        return false;
      }

      const numericAmount = Number(input.amount);
      if (!numericAmount || numericAmount <= 0) {
        setError("Enter a valid amount");
        return false;
      }

      setIsSwapping(true);
      setError("");

      try {
        const lamports = Math.floor(numericAmount * 1_000_000_000).toString();
        const data = await buildSwapTx({
          mintAddress: input.mint,
          amountLamports: lamports,
          userPublicKey: publicKey.toString(),
          isBuy: input.isBuy,
        });

        if (!data.success) {
          throw new Error(data.error || "Swap build failed");
        }

        const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, "confirmed");

        showToast(`${input.isBuy ? "Buy" : "Sell"} successful!`, "success");
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Swap failed";
        setError(message);
        showToast(message, "error");
        return false;
      } finally {
        setIsSwapping(false);
      }
    },
    [connected, publicKey, sendTransaction, connection, showToast]
  );

  return { swap, isSwapping, error, setError };
}
