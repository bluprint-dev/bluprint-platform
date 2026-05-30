"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
  TransactionInstruction
} from "@solana/web3.js";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createAndRegisterLaunch } from "@metaplex-foundation/genesis";
import { genesis } from "@metaplex-foundation/genesis";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Rocket, Upload, Check, AlertCircle, Loader2, Copy, Sparkles, Activity } from "lucide-react";

import Footer from "@/app/components/Footer";
import { useDexStore } from "@/store/dexStore";
import { normalizeToken } from "@/lib/dex/normalizeToken";
import bs58 from "bs58";

const CREATE_FEE_SOL = 0.01;

const FEE_DISTRIBUTION = [
  { address: "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x", percentage: 58 },
  { address: "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc", percentage: 32 },
  { address: "A692UafMRPEofwLsnD1NjWF9usiePRTJAd4Cpz8m6Y5X", percentage: 10 },
];

const BONDING_CURVE_FEE_WALLET = "AimBpCdpPmTB5QeJ6WwgrBzNmMsjR3MvNe9zgNhzomZ6";

const TERMINAL_MESSAGES = [
  "Uploading metadata...",
  "Initializing bonding curve...",
  "Seeding liquidity...",
  "Awaiting confirmation...",
];

const BLACKLIST = ["SOL", "USDC", "USDT", "BONK", "WIF", "JUP", "PYTH", "JTO"];

export default function CreatePage() {
  const { connected, publicKey, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [terminalStep, setTerminalStep] = useState(-1);
  const [terminalText, setTerminalText] = useState("");

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mintAddress, setMintAddress] = useState<string | null>(null);

  const isSubmitting = useRef(false);

  // =========================
  // REFERRAL BIND (NEW)
  // =========================
  const bindReferral = async (wallet: string) => {
    try {
      const code = localStorage.getItem("refCode");
      if (!code) return;

      await fetch("/api/referral/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          code
        }),
      });
    } catch (e) {
      console.log("referral bind failed (non-blocking)");
    }
  };

  // =========================
  // CREATE FLOW
  // =========================
  const handleCreate = async () => {
    if (!connected || !publicKey) return;

    if (!uploadedImageUrl) {
      setError("Image required");
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    setError("");
    setTerminalStep(0);

    try {
      // 🔥 REFERRAL BIND FIRST (IMPORTANT)
      await bindReferral(publicKey.toString());

      let singleSig: string | null = null;

      const umi = createUmi(connection.rpcEndpoint).use(genesis());
      umi.use(walletAdapterIdentity(wallet!.adapter));

      const result = await createAndRegisterLaunch(
        umi,
        {},
        {
          wallet: publicKey.toString(),
          launchType: "bondingCurve",
          token: {
            name: tokenName,
            symbol: tokenSymbol,
            image: uploadedImageUrl,
            description: tokenDescription || "",
          },
          launch: {
            creatorFeeWallet: BONDING_CURVE_FEE_WALLET,
          },
        } as any,
        {
          txSender: async (txs: any[]) => {
            const tx = new Transaction();

            const latest = await connection.getLatestBlockhash();
            tx.recentBlockhash = latest.blockhash;
            tx.feePayer = publicKey;

            const sig = await sendTransaction(tx, connection, {
              skipPreflight: false,
              preflightCommitment: "confirmed",
            });

            await connection.confirmTransaction(sig, "confirmed");

            singleSig = sig;
            return [];
          },
        }
      );

      setTerminalStep(1);

      // verify backend
      const res = await fetch("/api/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: singleSig,
          userPublicKey: publicKey.toString(),
          tokenData: {
            name: tokenName,
            symbol: tokenSymbol,
            imageUrl: uploadedImageUrl,
            description: tokenDescription,
          },
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setTerminalStep(2);

      useDexStore.getState().addOptimisticToken(
        normalizeToken({
          mint: result.mintAddress,
          name: tokenName,
          symbol: tokenSymbol,
          imageUrl: uploadedImageUrl,
          creator: publicKey.toString(),
          createdAt: Date.now(),
        })
      );

      setMintAddress(result.mintAddress);
      setSuccess(true);
      setIsLoading(false);

    } catch (e: any) {
      setError(e.message || "error");
      setIsLoading(false);
    }

    isSubmitting.current = false;
  };

  if (success && mintAddress) {
    return (
      <div className="p-10 text-white">
        <h1>Token Created 🚀</h1>
        <p>{mintAddress}</p>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      <input placeholder="name" onChange={e => setTokenName(e.target.value)} />
      <input placeholder="symbol" onChange={e => setTokenSymbol(e.target.value)} />
      <input placeholder="image url" onChange={e => setUploadedImageUrl(e.target.value)} />

      <button onClick={handleCreate} disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Token"}
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}