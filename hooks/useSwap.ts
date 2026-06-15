import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useToast } from "@/app/components/ToastProvider";

export type SwapInput = {
  genesisAccount: string;
  mint: string;
  amount: string;
  isBuy: boolean;
};

const TOKEN_DECIMALS = 1_000_000; // 6 decimal

// confirmTransaction yerine polling tabanlı güvenilir confirm
async function confirmWithPolling(
  connection: any,
  signature: string,
  timeoutMs = 90_000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = value?.[0];
    if (status) {
      if (status.err) {
        throw new Error("Transaction failed on-chain: " + JSON.stringify(status.err));
      }
      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        return; // başarılı
      }
    }
    await new Promise((r) => setTimeout(r, 2000)); // 2 saniyede bir kontrol
  }
  throw new Error("Transaction not confirmed in time — check explorer manually.");
}

export function useSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
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
        const amountLamports = input.isBuy
          ? Math.floor(Number(input.amount) * 1_000_000_000).toString()
          : input.amount;

        const res = await fetch("/api/bonding-curve/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genesisAccount: input.genesisAccount,
            mintAddress: input.mint,
            amount: amountLamports,
            userPublicKey: publicKey.toString(),
            isBuy: input.isBuy,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error ?? "SWAP_FAILED");
        }

        // Fee ATA tx varsa önce gönder
        if (data.feeAtaTx) {
          const feeAtaTx = VersionedTransaction.deserialize(
            Buffer.from(data.feeAtaTx, "base64")
          );
          const signedFeeAtaTx = await signTransaction!(feeAtaTx);
          const feeSig = await connection.sendRawTransaction(signedFeeAtaTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          });
          await confirmWithPolling(connection, feeSig);
        }

        // Asıl swap tx
        const tx = VersionedTransaction.deserialize(
          Buffer.from(data.transaction, "base64")
        );
        const signedTx = await signTransaction!(tx);
        const sig = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          preflightCommitment: "confirmed",
        });

        // 90 saniyeye kadar polling ile bekle
        await confirmWithPolling(connection, sig);

        // Trade kaydı
        try {
          const amountSol = input.isBuy
            ? Number(input.amount)
            : Number(data.quote?.amountOut ?? 0) / 1_000_000_000;

          const amountToken = input.isBuy
            ? Number(data.quote?.amountOut ?? 0) / TOKEN_DECIMALS
            : Number(input.amount) / TOKEN_DECIMALS;

          const price = amountToken > 0 ? amountSol / amountToken : 0;

          await fetch("/api/trades/insert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mint: input.mint,
              price,
              amount_sol: amountSol,
              amount_token: amountToken,
              is_buy: input.isBuy,
              wallet: publicKey.toString(),
              tx_signature: sig,
            }),
          });
        } catch (dbErr) {
          console.warn("Trade log failed:", dbErr);
        }

        showToast(
          input.isBuy ? "Buy successful! 🚀" : "Sell successful! ✅",
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
    [connected, publicKey, signTransaction, connection, showToast]
  );

  return { swap, isSwapping, error, setError };
}