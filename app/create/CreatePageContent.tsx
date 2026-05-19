"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSearchParams } from "next/navigation";
import {
  Connection, Keypair, SystemProgram, Transaction,
  LAMPORTS_PER_SOL, PublicKey,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE, TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import SuccessModal from "../components/SuccessModal";
import { useToast } from "../components/ToastProvider";
import { useI18n } from "../lib/i18n-provider";

// ==================== KONFIGÜRASYON ====================
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.helius-rpc.com/?api-key=fdbb8762-06b5-4bbd-ab1e-33310587e2d4";
const PLATFORM_WALLET = "FPLcpDVhRTMTMGquiyeK3AwNtCaQQgNp6UwHPTcWDS2n";
const OWNER_WALLET = "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x";
const KUZEN_WALLET = "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc";

// TEST MODU - GEÇİCİ DÜŞÜK ÜCRETLER (Mainnet'te 0.15 SOL olacak)
const TOTAL_FEE = 0.006 * LAMPORTS_PER_SOL;           // Toplam ücret: 0.03 SOL (test)
const REFERRAL_REWARD = 0.00 * LAMPORTS_PER_SOL;     // Referrer'a giden: 0.01 SOL (test)
// Mainnet'te: TOTAL_FEE = 0.15 SOL, REFERRAL_REWARD = 0.05 SOL

// Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export default function CreatePageContent() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [time, setTime] = useState(0);
  const [mintAddress, setMintAddress] = useState("");
  const [tokensLeft, setTokensLeft] = useState(100);
  const [myPromoCode, setMyPromoCode] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [referrerWallet, setReferrerWallet] = useState<string | null>(null);

  // Form state
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState(1_000_000_000);
  const [tokenDecimals, setTokenDecimals] = useState(9);
  const [tokenImage, setTokenImage] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [revokeMint, setRevokeMint] = useState(false);
  const [revokeFreeze, setRevokeFreeze] = useState(false);
  const [revokeUpdate, setRevokeUpdate] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const secureToken = revokeMint || revokeFreeze || revokeUpdate;
  const urlReferrer = searchParams.get("ref");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/api/token-stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTokensLeft(data.tokensLeft);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchMyPromoCode = async () => {
      if (publicKey) {
        try {
          const res = await fetch(`/api/promo?wallet=${publicKey.toString()}`);
          const data = await res.json();
          if (data.success && data.promoCode) {
            setMyPromoCode(data.promoCode);
          }
        } catch (err) {
          console.error("Failed to fetch promo code:", err);
        }
      }
    };
    fetchMyPromoCode();
  }, [publicKey]);

  useEffect(() => {
    const fetchReferrerByPromoCode = async () => {
      if (promoCodeInput && promoCodeInput.length === 7) {
        try {
          const res = await fetch(`/api/promo?code=${promoCodeInput}`);
          const data = await res.json();
          if (data.success && data.wallet && data.wallet !== publicKey?.toString()) {
            setReferrerWallet(data.wallet);
            showToast(`🎉 Promo code applied! 0.01 SOL will go to referrer`, "success");
          } else {
            setReferrerWallet(null);
            if (promoCodeInput) {
              showToast("Invalid promo code", "error");
            }
          }
        } catch (err) {
          setReferrerWallet(null);
        }
      } else {
        setReferrerWallet(null);
      }
    };
    fetchReferrerByPromoCode();
  }, [promoCodeInput, publicKey, showToast]);

  // ==================== RESİM YÜKLEME (PINATA) ====================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast("❌ Please upload an image file", "error");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ Image must be less than 5MB", "error");
      return;
    }
    
    showToast("📤 Uploading image to IPFS...", "info");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.success) {
        setTokenImage(data.url);
        setPreviewImage(URL.createObjectURL(file));
        showToast("✅ Image uploaded to IPFS!", "success");
      } else {
        showToast(`❌ ${data.error}`, "error");
      }
    } catch (err: any) {
      showToast(`❌ ${err.message}`, "error");
    }
  };

  // ==================== METADATA YÜKLEME (PINATA) ====================
  const uploadMetadataToPinata = async (imageUrl: string) => {
    const metadata = {
      name: tokenName,
      symbol: tokenSymbol,
      description: description || `${tokenName} token created on BluPrint`,
      image: imageUrl,
      external_url: "https://bluprint.fun",
      attributes: [
        {
          trait_type: "Created By",
          value: "BluPrint"
        },
        {
          trait_type: "Supply",
          value: tokenSupply.toLocaleString()
        },
        {
          trait_type: "Decimals",
          value: tokenDecimals
        }
      ],
      properties: {
        creators: [
          {
            address: publicKey?.toString(),
            share: 100
          }
        ]
      }
    };

    const res = await fetch("/api/upload-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to upload metadata");
    }
    
    return data.uri;
  };

  const validateInputs = useCallback(() => {
    if (tokenName.length < 3 || tokenName.length > 32) return "Token name must be 3-32 characters";
    if (tokenSymbol.length < 2 || tokenSymbol.length > 8) return "Symbol must be 2-8 characters";
    if (!/^[A-Z0-9]+$/i.test(tokenSymbol)) return "Symbol can only contain letters and numbers";
    if (tokenSupply < 1000 || tokenSupply > 10_000_000_000) return "Supply must be between 1,000 and 10,000,000,000";
    if (tokenDecimals < 0 || tokenDecimals > 9) return "Decimals must be between 0 and 9";
    if (!tokenImage) return "Please upload a logo";
    return null;
  }, [tokenName, tokenSymbol, tokenSupply, tokenDecimals, tokenImage]);

  // ==================== TOKEN OLUŞTURMA ====================
  const createToken = async () => {
    if (isProcessing || loading) return;
    if (!publicKey) {
      setVisible(true);
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      showToast(`❌ ${validationError}`, "error");
      return;
    }

    const lastCreate = localStorage.getItem('bluprint_last_create');
    if (lastCreate && Date.now() - parseInt(lastCreate) < 60000) {
      const remaining = Math.ceil((60000 - (Date.now() - parseInt(lastCreate))) / 1000);
      showToast(`Please wait ${remaining} seconds before creating another token`, "error");
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setProgress(0);
    setStep("🚀 Initializing...");
    setStatus("");

    const start = Date.now();

    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        const elapsed = (Date.now() - start) / 1000;
        return Math.min(90, Math.floor((elapsed / 15) * 100));
      });
    }, 100);

    try {
      // ========== 1. METADATA'YI IPFS'E YÜKLE ==========
      setStep("📤 Uploading metadata to IPFS...");
      setProgress(5);
      
      const metadataUri = await uploadMetadataToPinata(tokenImage);
      console.log("✅ Metadata URI:", metadataUri);
      setProgress(15);

      // ========== 2. TOKEN OLUŞTUR ==========
      const connection = new Connection(RPC_URL, "confirmed");
      
      // Referral sistemi
      let finalReferrer: string | null = null;
      if (urlReferrer && urlReferrer.length === 44 && urlReferrer !== publicKey.toString()) {
        finalReferrer = urlReferrer;
      }
      if (!finalReferrer && referrerWallet && referrerWallet !== publicKey.toString()) {
        finalReferrer = referrerWallet;
      }
      
      const hasReferral = !!finalReferrer;
      
      // MİKTAR HESAPLAMALARI
      let amountToDistribute = TOTAL_FEE;
      
      if (hasReferral) {
        amountToDistribute = TOTAL_FEE - REFERRAL_REWARD;
      }
      
      // 3 cüzdan arasında dağıtım (%10, %58, %32)
      const platformShare = Math.floor(amountToDistribute * 0.10);
      const yourShare = Math.floor(amountToDistribute * 0.58);
      const kuzenShare = amountToDistribute - platformShare - yourShare;
      
      // Mint keypair
      setStep("🔑 Creating mint account...");
      setProgress(20);
      const mintKeypair = Keypair.generate();
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      
      // ATA
      setStep("📝 Creating token account...");
      setProgress(30);
      const ata = await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey);
      
      // Supply hesaplama (BigInt ile güvenli)
      const supply = BigInt(tokenSupply) * BigInt(10 ** tokenDecimals);
      
      // Metadata PDA
      const [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const metadataData = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: metadataUri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      };
      
      // Transaction
      setStep("📦 Building transaction...");
      setProgress(40);
      const transaction = new Transaction();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // 1. Mint account oluştur
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // 2. Mint'i başlat
      transaction.add(
        createInitializeMintInstruction(mintKeypair.publicKey, tokenDecimals, publicKey, secureToken ? publicKey : null)
      );

      // 3. Referral varsa referrer'a gönder
      if (hasReferral && finalReferrer) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(finalReferrer),
            lamports: REFERRAL_REWARD,
          })
        );
      }

      // 4. Platform cüzdanlarına dağıt
      transaction.add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(PLATFORM_WALLET), lamports: platformShare })
      );
      transaction.add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(OWNER_WALLET), lamports: yourShare })
      );
      transaction.add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(KUZEN_WALLET), lamports: kuzenShare })
      );

      // 5. ATA oluştur
      transaction.add(
        createAssociatedTokenAccountInstruction(publicKey, ata, publicKey, mintKeypair.publicKey)
      );

      // 6. Token mintle (BigInt ile)
      transaction.add(
        createMintToInstruction(mintKeypair.publicKey, ata, publicKey, supply)
      );

      // 7. METADATA oluştur
      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: mintKeypair.publicKey,
            mintAuthority: publicKey,
            payer: publicKey,
            updateAuthority: publicKey,
          },
          {
            createMetadataAccountArgsV3: {
              data: metadataData,
              isMutable: !revokeUpdate,
              collectionDetails: null,
            },
          }
        )
      );

      // 8. Revoke'lar
      if (secureToken) {
        if (revokeMint) {
          transaction.add(
            createSetAuthorityInstruction(mintKeypair.publicKey, publicKey, AuthorityType.MintTokens, null)
          );
        }
        if (revokeFreeze) {
          transaction.add(
            createSetAuthorityInstruction(mintKeypair.publicKey, publicKey, AuthorityType.FreezeAccount, null)
          );
        }
      }

      transaction.partialSign(mintKeypair);

      setStep("📝 Please sign the transaction...");
      setProgress(75);
      
      console.log("📋 Transaction instructions count:", transaction.instructions.length);
      
      const signature = await sendTransaction(transaction, connection);
      
      setStep("⏳ Confirming transaction...");
      setProgress(90);
      
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      clearInterval(progressInterval.current!);
      setProgress(100);
      setStep("✅ Done! Your token is ready!");

      setTime((Date.now() - start) / 1000);
      const newMintAddress = mintKeypair.publicKey.toBase58();
      setMintAddress(newMintAddress);
      
      setSuccessData({
        mint: newMintAddress,
        name: tokenName,
        symbol: tokenSymbol,
        supply: tokenSupply,
        decimals: tokenDecimals,
        secureToken: secureToken,
        revokeMint,
        revokeFreeze,
        revokeUpdate,
        referralApplied: hasReferral,
        referrer: finalReferrer,
        tokensLeft: tokensLeft - 1,
        feePaid: TOTAL_FEE / LAMPORTS_PER_SOL,
        twitter,
        telegram,
        website,
        tokenImage,
        description,
        metadataUri,
      });
      
      setStatus("");
      showToast("🎉 Token created successfully!", "success");
      setTokensLeft((prev) => prev - 1);
      
      // Redis'e kaydet
      try {
        await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mint: newMintAddress,
            name: tokenName,
            symbol: tokenSymbol,
            createdBy: publicKey.toString(),
            createdAt: new Date().toISOString(),
            image: tokenImage,
            metadataUri,
            twitter,
            telegram,
            website,
          }),
        });
        console.log("✅ Token saved to Redis");
      } catch (err) {
        console.error("Failed to save token to Redis:", err);
      }
      
      localStorage.setItem('bluprint_last_create', Date.now().toString());
      
      // Promo code'u yenile
      const promoRes = await fetch(`/api/promo?wallet=${publicKey.toString()}`);
      const promoData = await promoRes.json();
      if (promoData.success && promoData.promoCode) {
        setMyPromoCode(promoData.promoCode);
      }
      
    } catch (err: any) {
      clearInterval(progressInterval.current!);
      console.error("Create token error:", err);
      
      let errorMessage = err.message || "Unknown error";
      if (err.message?.includes("insufficient")) {
        errorMessage = "Insufficient SOL balance.";
      } else if (err.message?.includes("User rejected")) {
        errorMessage = "You rejected the transaction.";
      } else if (err.message?.includes("0x0")) {
        errorMessage = "Transaction simulation failed. Check your wallet balance and try again.";
      }
      
      setStatus(`❌ ${errorMessage}`);
      setProgress(0);
      showToast(`❌ ${errorMessage}`, "error");
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  if (successData) {
    return (
      <SuccessModal
        successData={successData}
        mintAddress={mintAddress}
        time={time}
        onReset={() => {
          setSuccessData(null);
          setTokenName("");
          setTokenSymbol("");
          setTokenSupply(1_000_000_000);
          setTokenDecimals(9);
          setTokenImage("");
          setPreviewImage(null);
          setDescription("");
          setRevokeMint(false);
          setRevokeFreeze(false);
          setRevokeUpdate(false);
          setTwitter("");
          setTelegram("");
          setWebsite("");
          setShowSocialLinks(false);
          setPromoCodeInput("");
          setReferrerWallet(null);
        }}
        onHome={() => setSuccessData(null)}
      />
    );
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-transparent">
        {/* SİYAH OVERLAY - ÇOK HAFİF */}
        <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
        
        {/* Ana içerik */}
        <div className="relative z-10 pt-20 sm:pt-28 max-w-5xl mx-auto px-3 sm:px-4 pb-16">
          {tokensLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-3 sm:p-4 text-white text-center shadow-2xl"
            >
              <div className="flex items-center justify-center gap-2 flex-wrap text-sm sm:text-base font-bold">
                <span>🎁</span>
                <span>{t("pool_title")}</span>
                <span>🎁</span>
              </div>
              <div className="text-xs sm:text-sm mt-1">
                ⚡ {t("pool_first")} <span className="font-bold text-xl">{tokensLeft}</span> {t("pool_tokens")}:{" "}
                <span className="font-bold">{(TOTAL_FEE / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
              </div>
            </motion.div>
          )}

          <div className="text-center mb-6 sm:mb-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-5xl font-bold text-white"
            >
              {t("create_title")}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 mt-3 text-sm sm:text-base"
            >
              {t("create_subtitle")}
            </motion.p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-8">
            {/* SOL TARAF - FORM */}
            <div className="bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">{t("create_name_label")}</label>
                  <input 
                    type="text" 
                    value={tokenName} 
                    onChange={(e) => setTokenName(e.target.value)} 
                    placeholder={t("create_name_placeholder")} 
                    className="w-full h-11 sm:h-12 px-3 sm:px-4 text-sm border border-gray-700 rounded-xl bg-gray-800/50 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">{t("create_symbol_label")}</label>
                  <input 
                    type="text" 
                    value={tokenSymbol} 
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())} 
                    placeholder={t("create_symbol_placeholder")} 
                    className="w-full h-11 sm:h-12 px-3 sm:px-4 text-sm border border-gray-700 rounded-xl bg-gray-800/50 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">{t("create_supply_label")}</label>
                  <input 
                    type="number" 
                    value={tokenSupply} 
                    onChange={(e) => setTokenSupply(Number(e.target.value))} 
                    className="w-full h-11 sm:h-12 px-3 sm:px-4 text-sm border border-gray-700 rounded-xl bg-gray-800/50 text-white outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">{t("create_decimals_label")}</label>
                  <input 
                    type="number" 
                    value={tokenDecimals} 
                    onChange={(e) => setTokenDecimals(Number(e.target.value))} 
                    className="w-full h-11 sm:h-12 px-3 sm:px-4 text-sm border border-gray-700 rounded-xl bg-gray-800/50 text-white outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">{t("create_logo_label")}</label>
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-xl p-4 sm:p-6 text-center cursor-pointer hover:border-blue-500 transition bg-gray-800/30" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-xl object-cover" />
                  ) : (
                    <div className="text-gray-400 text-sm">
                      <div className="text-2xl mb-1">🖼️</div>
                      {t("create_logo_placeholder")}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" onChange={handleFileUpload} className="hidden" />
                </div>
                {tokenImage && (
                  <p className="text-xs text-green-400 mt-1">✅ Logo uploaded to IPFS</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">{t("create_desc_label")}</label>
                <textarea 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder={t("create_desc_placeholder")} 
                  className="w-full px-3 sm:px-4 py-3 text-sm border border-gray-700 rounded-xl bg-gray-800/50 text-white outline-none resize-none" 
                />
              </div>

              {/* PROMO CODE INPUT */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  🎫 Promo Code <span className="text-gray-500">(optional - get discount!)</span>
                </label>
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter promo code (e.g., ABC1234)"
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 text-sm border border-gray-700 rounded-xl bg-gray-800/50 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
                {referrerWallet && (
                  <p className="text-xs text-green-400 mt-1">
                    ✅ Valid promo code! {(REFERRAL_REWARD / LAMPORTS_PER_SOL).toFixed(2)} SOL will go to referrer
                  </p>
                )}
              </div>
            </div>

            {/* SAĞ TARAF - LAUNCH PANEL */}
            <div className="bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 lg:sticky lg:top-28 space-y-4">
              <div className="text-center">
                <div className="text-5xl mb-2 animate-pulse">⚡</div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t("create_launch")}</div>
                {tokensLeft > 0 && <div className="inline-flex items-center gap-1 mt-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium border border-amber-500/30">🎁 {t("create_first100")}</div>}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creation Fee</span>
                    <span className="font-bold text-green-400">{(TOTAL_FEE / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                  </div>
                  {referrerWallet && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Referrer gets:</span>
                      <span className="text-green-400">{(REFERRAL_REWARD / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                    </div>
                  )}
                  <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-300">Total to pay:</span>
                    <span className="text-green-400 font-bold text-lg">{(TOTAL_FEE / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                  </div>
                </div>
              </div>

              
              {/* Secure Token - 3 Revoke */}
              <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-sm border border-blue-500/30 shadow-lg">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="text-base font-bold text-white">🔒 {t("create_secure_label")}</span>
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-0.5 rounded-full font-bold">⭐ 3 REVOKES ⭐</span>
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={revokeMint} onChange={(e) => setRevokeMint(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-sm text-white/90 group-hover:text-white transition">🚫 Revoke Mint Authority</span>
                    <span className="text-[10px] text-white/50 hidden sm:inline">(No new tokens)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={revokeFreeze} onChange={(e) => setRevokeFreeze(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-sm text-white/90 group-hover:text-white transition">❄️ Revoke Freeze Authority</span>
                    <span className="text-[10px] text-white/50 hidden sm:inline">(No account freezes)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={revokeUpdate} onChange={(e) => setRevokeUpdate(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-sm text-white/90 group-hover:text-white transition">📝 Revoke Update Authority</span>
                    <span className="text-[10px] text-white/50 hidden sm:inline">(Immutable metadata)</span>
                  </label>
                </div>
              </div>

              <button onClick={() => setShowSocialLinks(!showSocialLinks)} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg">
                🌐 {t("create_social_button")}
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{t("common_free")}</span>
              </button>

              <AnimatePresence>
                {showSocialLinks && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-2 p-3 bg-gray-800/50 rounded-xl">
                      <input type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder={t("create_twitter")} className="w-full h-10 px-3 text-sm border border-gray-700 rounded-lg bg-gray-900 text-white outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="url" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder={t("create_telegram")} className="w-full h-10 px-3 text-sm border border-gray-700 rounded-lg bg-gray-900 text-white outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={t("create_website")} className="w-full h-10 px-3 text-sm border border-gray-700 rounded-lg bg-gray-900 text-white outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {mounted && (
                <button 
                  onClick={createToken} 
                  disabled={loading || !tokenImage} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("create_deploying")}
                    </span>
                  ) : !connected ? t("nav_connect") : !tokenImage ? "📸 Upload logo first" : t("create_button")}
                </button>
              )}

              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{step}</span>
                    <span className="font-mono text-blue-400">{Math.floor(progress)}%</span>
                  </div>
                </motion.div>
              )}

              {status && (
                <div className="text-xs sm:text-sm text-center text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}