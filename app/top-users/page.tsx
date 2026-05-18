"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useI18n } from "../lib/i18n-provider";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

interface User {
  wallet: string;
  tokenCount: number;
  referralCount: number;
  tier?: "vip" | "premium" | null;
  createdAt?: string;
}

export default function TopUsersPage() {
  const { t } = useI18n();
  const { publicKey } = useWallet();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "week" | "month">("all");
  const [sortBy, setSortBy] = useState<"tokens" | "referrals">("tokens");

  useEffect(() => {
    fetchTopUsers();
  }, [timeframe, sortBy]);

  const fetchTopUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/top-users?timeframe=${timeframe}&sort=${sortBy}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch top users:", err);
    } finally {
      setLoading(false);
    }
  };

  const shortenWallet = (wallet: string) => {
    if (!wallet) return "";
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const getTierBadge = (tier?: string | null) => {
    if (tier === "vip") {
      return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{t("top_users_vip")}</span>;
    }
    if (tier === "premium") {
      return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{t("top_users_premium")}</span>;
    }
    return null;
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="relative z-10 pt-20 sm:pt-28 max-w-6xl mx-auto px-3 sm:px-4 pb-16">
          
          <div className="text-center mb-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
            >
              {t("top_users_title")}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 mt-3"
            >
              {t("top_users_subtitle")}
            </motion.p>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div className="flex gap-2">
              <button
                onClick={() => setTimeframe("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeframe === "all" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {t("top_users_all_time")}
              </button>
              <button
                onClick={() => setTimeframe("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeframe === "week" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {t("top_users_week")}
              </button>
              <button
                onClick={() => setTimeframe("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeframe === "month" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {t("top_users_month")}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("tokens")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sortBy === "tokens" 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {t("top_users_most_tokens")}
              </button>
              <button
                onClick={() => setSortBy("referrals")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sortBy === "referrals" 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {t("top_users_most_referrals")}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {t("top_users_no_users")}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user, index) => (
                <motion.div
                  key={user.wallet}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group relative bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 ${
                    publicKey?.toString() === user.wallet ? "border-blue-500/50 bg-blue-500/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 w-16">
                      <span className={`text-2xl font-bold ${
                        index === 0 ? "text-yellow-400" :
                        index === 1 ? "text-gray-300" :
                        index === 2 ? "text-orange-400" :
                        "text-gray-600"
                      }`}>
                        #{index + 1}
                      </span>
                    </div>

                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-medium">
                            {shortenWallet(user.wallet)}
                          </span>
                          {getTierBadge(user.tier)}
                          {publicKey?.toString() === user.wallet && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                              {t("top_users_you")}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          <span>{t("top_users_joined")}: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{user.tokenCount}</div>
                        <div className="text-xs text-gray-500">{t("top_users_tokens")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-400">{user.referralCount}</div>
                        <div className="text-xs text-gray-500">{t("top_users_referrals")}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {publicKey && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">{t("top_users_your_rank")}</div>
                  <div className="text-2xl font-bold text-white">
                    #{users.findIndex(u => u.wallet === publicKey.toString()) + 1 || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">{t("top_users_your_tokens")}</div>
                  <div className="text-2xl font-bold text-white">
                    {users.find(u => u.wallet === publicKey.toString())?.tokenCount || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">{t("top_users_your_referrals")}</div>
                  <div className="text-2xl font-bold text-green-400">
                    {users.find(u => u.wallet === publicKey.toString())?.referralCount || 0}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}