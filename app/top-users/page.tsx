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

function shortenWallet(wallet: string) {
  if (!wallet) return "";
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function RankBadge({ index }: { index: number }) {
  if (index === 0) return <span className="text-2xl">🥇</span>;
  if (index === 1) return <span className="text-2xl">🥈</span>;
  if (index === 2) return <span className="text-2xl">🥉</span>;
  return <span className="text-lg font-bold text-gray-600 font-mono">#{index + 1}</span>;
}

function Avatar({ wallet, index }: { wallet: string; index: number }) {
  const colors = [
    "from-yellow-400 to-orange-500",
    "from-gray-300 to-gray-400",
    "from-orange-400 to-red-500",
    "from-blue-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
  ];
  const color = colors[index % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm ring-2 ring-white/10 flex-shrink-0`}>
      {wallet.slice(0, 2).toUpperCase()}
    </div>
  );
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
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch top users:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier?: string | null) => {
    if (tier === "vip") return (
      <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
        👑 {t("top_users_vip")}
      </span>
    );
    if (tier === "premium") return (
      <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
        ⭐ {t("top_users_premium")}
      </span>
    );
    return null;
  };

  const myIndex = users.findIndex((u) => u.wallet === publicKey?.toString());
  const me = users[myIndex];

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-[#080810]">
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-yellow-950/20 via-transparent to-purple-950/20 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-yellow-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 pt-20 sm:pt-28 max-w-4xl mx-auto px-3 sm:px-4 pb-16">

          {/* Header */}
          <div className="text-center mb-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-yellow-400 text-sm font-bold">🏆 LEADERBOARD</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              {t("top_users_title")}
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-gray-500 mt-3 text-sm">
              {t("top_users_subtitle")}
            </motion.p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div className="flex gap-1.5 bg-gray-900/60 border border-gray-800/60 rounded-xl p-1">
              {(["all", "week", "month"] as const).map((tf) => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === tf ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                  }`}>
                  {tf === "all" ? t("top_users_all_time") : tf === "week" ? t("top_users_week") : t("top_users_month")}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 bg-gray-900/60 border border-gray-800/60 rounded-xl p-1">
              {(["tokens", "referrals"] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sortBy === s ? "bg-purple-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                  }`}>
                  {s === "tokens" ? t("top_users_most_tokens") : t("top_users_most_referrals")}
                </button>
              ))}
            </div>
          </div>

          {/* My Rank Card */}
          {publicKey && me && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/30 rounded-2xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-blue-400 font-mono">#{myIndex + 1}</div>
                  <div>
                    <div className="text-xs text-gray-500">{t("top_users_your_rank")}</div>
                    <div className="text-sm font-mono text-white">{shortenWallet(publicKey.toString())}</div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{me.tokenCount}</div>
                    <div className="text-xs text-gray-500">{t("top_users_your_tokens")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">{me.referralCount}</div>
                    <div className="text-xs text-gray-500">{t("top_users_your_referrals")}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* List */}
          <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">

            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_5rem_5rem] gap-3 px-4 py-3 border-b border-gray-800/60 bg-gray-900/60">
              {["Rank", "User", "Tokens", "Refs"].map((h, i) => (
                <div key={h} className={`text-[10px] text-gray-600 font-bold uppercase tracking-wider ${i > 1 ? "text-right" : ""}`}>
                  {h}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-gray-800" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-yellow-500 animate-spin" />
                </div>
                <p className="text-gray-600 text-sm">Loading leaderboard...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <div className="text-4xl mb-3">🏆</div>
                <p>{t("top_users_no_users")}</p>
              </div>
            ) : (
              users.map((user, index) => {
                const isMe = publicKey?.toString() === user.wallet;
                const isTop3 = index < 3;
                return (
                  <motion.div
                    key={user.wallet}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`group grid grid-cols-[3rem_1fr_5rem_5rem] gap-3 items-center px-4 py-3 border-b border-gray-800/40 last:border-0 transition-all duration-200 hover:bg-white/5 ${
                      isMe ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""
                    } ${isTop3 ? "bg-yellow-500/3" : ""}`}
                  >
                    {/* Rank */}
                    <div className="flex justify-center">
                      <RankBadge index={index} />
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar wallet={user.wallet} index={index} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-white text-sm font-medium">
                            {shortenWallet(user.wallet)}
                          </span>
                          {getTierBadge(user.tier)}
                          {isMe && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-bold">
                              {t("top_users_you")}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-600 mt-0.5">
                          {t("top_users_joined")}: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Tokens */}
                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono">{user.tokenCount}</div>
                      <div className="text-[10px] text-gray-600">{t("top_users_tokens")}</div>
                    </div>

                    {/* Referrals */}
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400 font-mono">{user.referralCount}</div>
                      <div className="text-[10px] text-gray-600">{t("top_users_referrals")}</div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}