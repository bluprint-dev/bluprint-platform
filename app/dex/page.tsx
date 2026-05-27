"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findMetadataPda } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { motion } from "framer-motion";
import { Search, Loader2, Flame, ChevronRight, ExternalLink, RefreshCw, Zap } from "lucide-react";
import Footer from "@/app/components/Footer";

interface Token {
  mint: string;
  name: string;
  symbol: string;
  imageUrl: string;
}

export default function DexPage() {
  const { connected, publicKey: walletPublicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState("");

  // Metaplex metadata'yi fetch et - alternatif yöntem (RPC ile)
  const fetchTokenMetadata = async (mintAddress: string): Promise<Token | null> => {
    try {
      const umi = createUmi(connection.rpcEndpoint);
      const mint = publicKey(mintAddress);
      
      // Metadata PDA'yı bul (programId gerekiyor)
      const programId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
      const [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          programId.toBuffer(),
          new PublicKey(mintAddress).toBuffer(),
        ],
        programId
      );
      
      // Metadata account'dan veriyi oku
      const accountInfo = await connection.getAccountInfo(metadataPda);
      
      if (!accountInfo) {
        console.log(`No metadata account for ${mintAddress}`);
        return null;
      }
      
      // URI'yi parse et (offset 33'ten itibaren string)
      const data = accountInfo.data;
      let offset = 1 + 32 + 32; // key + update auth + mint
      const nameLength = data[offset] as number;
      offset += 4;
      const name = data.slice(offset, offset + nameLength).toString('utf8');
      offset += nameLength;
      
      const symbolLength = data[offset] as number;
      offset += 4;
      const symbol = data.slice(offset, offset + symbolLength).toString('utf8');
      offset += symbolLength;
      
      const uriLength = data[offset] as number;
      offset += 4;
      const uri = data.slice(offset, offset + uriLength).toString('utf8');
      
      if (!uri) return null;
      
      // URI'den JSON'u fetch et
      const response = await fetch(uri);
      const metadataJson = await response.json();
      
      return {
        mint: mintAddress,
        name: name || metadataJson.name || "Unknown",
        symbol: symbol || metadataJson.symbol || "???",
        imageUrl: metadataJson.image || "",
      };
    } catch (err) {
      console.error(`Error fetching metadata for ${mintAddress}:`, err);
      return null;
    }
  };

  // Redis'ten token listesini al ve metadata'yı fetch et
  const fetchTokens = async () => {
    setLoading(true);
    try {
      // Redis'ten token mint listesini al
      const res = await fetch("/api/bonding-curve/tokens");
      const data = await res.json();
      
      if (!data.success || !data.tokens) {
        setTokens([]);
        return;
      }
      
      // Her token için metadata'yı fetch et
      const tokenMints = Array.isArray(data.tokens) ? data.tokens.map((t: any) => t.mint || t) : [];
      const tokenPromises = tokenMints.map(async (mint: string) => {
        const metadata = await fetchTokenMetadata(mint);
        return metadata;
      });
      
      const resolvedTokens = await Promise.all(tokenPromises);
      const validTokens = resolvedTokens.filter(t => t !== null) as Token[];
      
      setTokens(validTokens);
    } catch (err) {
      console.error("Fetch tokens error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSwap = async () => {
    if (!connected || !walletPublicKey) {
      alert("Connect wallet first");
      return;
    }
    if (!selectedToken || !amount) return;
    
    setSwapping(true);
    setSwapError("");
    
    try {
      const lamports = Math.floor(Number(amount) * 1_000_000_000);
      const res = await fetch("/api/bonding-curve/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mintAddress: selectedToken.mint,
          amount: lamports.toString(),
          userPublicKey: walletPublicKey.toString(),
          isBuy,
        }),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);
      
      alert("Swap successful!");
      setAmount("");
      setSwapError("");
    } catch (err: any) {
      setSwapError(err.message);
    } finally {
      setSwapping(false);
    }
  };

  const filtered = tokens.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-pink-500" />
              <span className="text-white font-bold text-xl">DEX</span>
            </div>
            <button onClick={fetchTokens} className="text-gray-500 hover:text-white transition">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT - Token List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tokens..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Token Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No tokens found. Be the first to create one!
              </div>
            ) : (
              <div className="grid gap-2">
                {filtered.map((token, idx) => (
                  <motion.div
                    key={token.mint}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => setSelectedToken(token)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                      selectedToken?.mint === token.mint
                        ? "bg-pink-500/10 border border-pink-500/30"
                        : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {token.imageUrl ? (
                        <img src={token.imageUrl} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {token.symbol?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{token.symbol}</span>
                          <span className="text-xs text-gray-500">{token.name}</span>
                        </div>
                        <p className="text-xs text-gray-600 font-mono">
                          {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - Trade Panel */}
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 sticky top-20">
            {!selectedToken ? (
              <div className="text-center py-12 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a token to trade</p>
              </div>
            ) : (
              <>
                {/* Token Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                  {selectedToken.imageUrl ? (
                    <img src={selectedToken.imageUrl} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {selectedToken.symbol?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xl">{selectedToken.symbol}</span>
                      <span className="text-xs text-gray-500">{selectedToken.name}</span>
                    </div>
                    <button
                      onClick={() => window.open(`https://solscan.io/token/${selectedToken.mint}`, "_blank")}
                      className="text-xs text-gray-500 hover:text-pink-500 transition flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Solscan
                    </button>
                  </div>
                </div>

                {/* Buy/Sell Toggle */}
                <div className="flex gap-2 p-1 rounded-xl bg-gray-800 mb-6">
                  <button
                    onClick={() => setIsBuy(true)}
                    className={`flex-1 py-2 rounded-lg font-bold transition ${
                      isBuy ? "bg-green-500 text-white" : "text-gray-400"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setIsBuy(false)}
                    className={`flex-1 py-2 rounded-lg font-bold transition ${
                      !isBuy ? "bg-red-500 text-white" : "text-gray-400"
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">
                    {isBuy ? "You pay (SOL)" : "You sell (tokens)"}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-12 px-4 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Swap Button */}
                <button
                  onClick={handleSwap}
                  disabled={swapping || !amount || !connected}
                  className={`w-full h-12 rounded-xl font-bold text-white transition ${
                    isBuy ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                  } disabled:opacity-50`}
                >
                  {swapping ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    `${isBuy ? "Buy" : "Sell"} ${selectedToken.symbol}`
                  )}
                </button>

                {swapError && (
                  <p className="text-red-400 text-sm mt-3 text-center">{swapError}</p>
                )}

                {!connected && (
                  <p className="text-gray-500 text-sm mt-3 text-center">
                    Connect wallet to trade
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}