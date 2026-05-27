import { Connection, PublicKey } from "@solana/web3.js";
import { redis } from "./redis";

const PLATFORM_WALLET = new PublicKey(
  "A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X"
);

const EXPECTED_FEE_LAMPORTS = 0.01 * 1_000_000_000;
const MAX_TX_AGE_SECONDS = 300;

type VerifyResult = {
  verified: boolean;
  error?: string;
};

function safeGet(keys: any, i: number) {
  try {
    return keys.get(i)?.toString();
  } catch {
    return null;
  }
}

export async function verifyPayment(
  signature: string,
  userPublicKey: string
): Promise<VerifyResult> {
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, "confirmed");

    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return { verified: false, error: "Transaction not found" };
    }

    // 1. REPLAY PROTECTION
    const already = await redis.get(`tx:${signature}`);
    if (already) {
      return { verified: false, error: "Already processed tx" };
    }

    // 2. TIME CHECK
    const now = Math.floor(Date.now() / 1000);
    const blockTime = tx.blockTime ?? 0;

    if (now - blockTime > MAX_TX_AGE_SECONDS) {
      return { verified: false, error: "Transaction too old" };
    }

    // 3. USER SIGNER CHECK (SAFE)
    const message = tx.transaction.message;
    const keys = message.getAccountKeys();

    const feePayer = safeGet(keys, 0);

    if (feePayer !== userPublicKey) {
      return { verified: false, error: "Invalid signer" };
    }

    // 4. BALANCE DELTA CHECK (PRIMARY)
    const pre = tx.meta.preBalances;
    const post = tx.meta.postBalances;

    if (!pre || !post) {
      return { verified: false, error: "Missing balance data" };
    }

    const accountKeys = message.getAccountKeys().staticAccountKeys;

    const platformIndex = accountKeys.findIndex(
      (k: any) => k.toString() === PLATFORM_WALLET.toString()
    );

    if (platformIndex === -1) {
      return { verified: false, error: "Platform wallet not in tx" };
    }

    const balanceDelta = post[platformIndex] - pre[platformIndex];

    // 5. FALLBACK: INSTRUCTION CHECK (SECONDARY)
    let instructionAmount = 0;

    const instructions = tx.transaction.message.compiledInstructions;

    for (const ix of instructions) {
      const programId = accountKeys[ix.programIdIndex]?.toString();

      if (programId !== "11111111111111111111111111111111") continue;

      const to = accountKeys[ix.accountKeyIndexes[1]]?.toString();

      // SystemProgram transfer only heuristic fallback
      if (to === PLATFORM_WALLET.toString()) {
        const lamports = Number(
          Buffer.from(ix.data).readBigUInt64LE(1)
        );

        instructionAmount += lamports;
      }
    }

    // 6. FINAL PAYMENT DECISION
    const received = Math.max(balanceDelta, instructionAmount);

    if (received < EXPECTED_FEE_LAMPORTS) {
      return {
        verified: false,
        error: "Insufficient payment",
      };
    }

    // 7. MARK AS PROCESSED
    await redis.set(`tx:${signature}`, "1", { ex: 3600 });

    return { verified: true };
  } catch (err: any) {
    return {
      verified: false,
      error: err?.message || "Verification failed",
    };
  }
}