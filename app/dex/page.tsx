"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

interface BondingCurveToken {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  totalSupply: string;
  virtualSolReserves: string;
  virtualTokenReserves: string;
  creatorFeeAccrued: string;
  isComplete: boolean;
  createdAt: number;
}

export default function DexPage() {
  const { publicKey, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState<BondingCurveToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<BondingCurveToken | null>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [quote, setQuote] = useState<{ amountOut: string; fee: string; creatorFee: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bonding-curve/tokens');
      const data = await res.json();
      if (data.success) setTokens(data.tokens);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuote = async (mint: string, amount: string, isBuy: boolean) => {
    if (!amount || Number(amount) <= 0) {
      setQuote(null);
      return;
    }
    try {
      const res = await fetch(`/api/bonding-curve/quote?mint=${mint}&amount=${amount}&isBuy=${isBuy}`);
      const data = await res.json();
      if (data.success) setQuote(data.quote);
      else setQuote(null);
    } catch (err) {
      console.error(err);
      setQuote(null);
    }
  };

  const handleBuy = async () => {
    if (!publicKey || !selectedToken || !buyAmount) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/bonding-curve/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: selectedToken.mint,
          amount: buyAmount,
          userPublicKey: publicKey.toString(),
          isBuy: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Buy successful! Signature: ${data.signature.slice(0, 20)}...`);
        setBuyAmount('');
        setQuote(null);
        fetchTokens();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!publicKey || !selectedToken || !sellAmount) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/bonding-curve/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: selectedToken.mint,
          amount: sellAmount,
          userPublicKey: publicKey.toString(),
          isBuy: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Sell successful! Signature: ${data.signature.slice(0, 20)}...`);
        setSellAmount('');
        setQuote(null);
        fetchTokens();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-purple-900/30 to-black" />
        <div className="relative z-10 pt-20 sm:pt-24 max-w-7xl mx-auto px-4 pb-16">
          <h1 className="text-3xl font-bold text-white mb-2">BluPrint DEX</h1>
          <p className="text-gray-500 mb-8">Trade bonding curve tokens instantly – no pool, pure curve</p>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Token Listesi */}
            <div className="lg:col-span-1 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-4">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Active Tokens
              </h2>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No bonding curve tokens yet</div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {tokens.map((token) => (
                    <button
                      key={token.mint}
                      onClick={() => {
                        setSelectedToken(token);
                        setBuyAmount('');
                        setSellAmount('');
                        setQuote(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedToken?.mint === token.mint
                          ? 'bg-blue-600/20 border border-blue-500/50'
                          : 'bg-gray-800/30 hover:bg-gray-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {token.image ? (
                          <img src={token.image} className="w-8 h-8 rounded-full object-cover" alt={token.symbol} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {token.symbol?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-white text-sm">{token.name}</div>
                          <div className="text-xs text-gray-400">{token.symbol}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{token.totalSupply ? token.totalSupply.slice(0, 6) : '0'} supply</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trading Panel */}
            <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-6">
              {selectedToken ? (
                <>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                    {selectedToken.image ? (
                      <img src={selectedToken.image} className="w-12 h-12 rounded-full object-cover" alt={selectedToken.symbol} />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                        {selectedToken.symbol?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedToken.name}</h2>
                      <p className="text-gray-400">{selectedToken.symbol}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-xs text-gray-500">Virtual SOL</div>
                      <div className="text-sm text-white font-mono">{selectedToken.virtualSolReserves} SOL</div>
                    </div>
                  </div>

                  {/* Buy */}
                  <div className="mb-6 p-4 bg-gray-800/30 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium">Buy with SOL</label>
                      <span className="text-xs text-gray-400">Estimated</span>
                    </div>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => {
                        setBuyAmount(e.target.value);
                        fetchQuote(selectedToken.mint, e.target.value, true);
                      }}
                      placeholder="Amount in SOL"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {quote && (
                      <div className="mt-2 text-sm text-gray-300 space-y-1">
                        <div className="flex justify-between">
                          <span>You get:</span>
                          <span className="font-mono text-green-400">{quote.amountOut} tokens</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Fee (protocol+platform):</span>
                          <span>{quote.fee} SOL</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleBuy}
                      disabled={!buyAmount || processing || Number(buyAmount) <= 0}
                      className="mt-3 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
                    >
                      {processing ? 'Processing...' : 'Buy'}
                    </button>
                  </div>

                  {/* Sell */}
                  <div className="p-4 bg-gray-800/30 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white font-medium">Sell tokens</label>
                      <span className="text-xs text-gray-400">You get SOL</span>
                    </div>
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => {
                        setSellAmount(e.target.value);
                        fetchQuote(selectedToken.mint, e.target.value, false);
                      }}
                      placeholder="Token amount"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {quote && (
                      <div className="mt-2 text-sm text-gray-300 space-y-1">
                        <div className="flex justify-between">
                          <span>You get:</span>
                          <span className="font-mono text-green-400">{quote.amountOut} SOL</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Fee (protocol+platform):</span>
                          <span>{quote.fee} SOL</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleSell}
                      disabled={!sellAmount || processing || Number(sellAmount) <= 0}
                      className="mt-3 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition"
                    >
                      {processing ? 'Processing...' : 'Sell'}
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-gray-600 text-center">
                    * Bonding curve formula: price = supply² / constant. 0.5% protocol fee + 0.3% platform fee.
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-5xl mb-3">📊</div>
                  <p>Select a token from the list to start trading</p>
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