"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useToast } from "../components/ToastProvider";
import { useI18n } from "../lib/i18n-provider";
import confetti from "canvas-confetti";

const MILESTONES = [
  { count: 10, bonus: 0.1, icon: "🥉", label: "Bronze" },
  { count: 25, bonus: 0.2, icon: "🥈", label: "Silver" },
  { count: 50, bonus: 0.5, icon: "🥇", label: "Gold" },
  { count: 100, bonus: 1.0, icon: "💎", label: "Diamond" },
];

interface MilestoneInfo {
  count: number;
  bonus: number;
  reached: boolean;
  claimed: boolean;
}

export default function ReferralPage() {
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<{ wallet: string; referrals: number }[]>([]);
  const [milestones, setMilestones] = useState<MilestoneInfo[]>([]);
  const [nextMilestone, setNextMilestone] = useState<number | null>(10);
  const [animateMilestone, setAnimateMilestone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (publicKey) {
      fetchPromoCode();
      fetchEarnings();
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [publicKey]);

  const fetchPromoCode = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`/api/user-promocode?wallet=${publicKey.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPromoCode(data.promoCode);
        setHasToken(data.hasToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`/api/referral-earnings?wallet=${publicKey.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEarnings(data.earnings);
        setTotalReferrals(data.totalReferrals);
        setMilestones(data.milestones || []);
        setNextMilestone(data.nextMilestone);
        if (data.totalReferrals > 0 && data.totalReferrals % 10 === 0) {
          setAnimateMilestone(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#3b82f6", "#8b5cf6", "#06b6d4"] });
          setTimeout(() => setAnimateMilestone(false), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/referral-leaderboard");
      const data = await res.json();
      if (data.success) setLeaderboard(data.leaderboard.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async () => {
    if (!publicKey) { showToast(t('toast_connect'), "warning"); return; }
    if (earnings <= 0) { showToast(t('ref_no_earnings'), "info"); return; }
    setClaiming(true);
    try {
      const res = await fetch("/api/claim-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toString(), amount: earnings }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${earnings.toFixed(4)} SOL claimed!`, "success");
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#22c55e", "#10b981"] });
        setEarnings(0);
        setTimeout(() => fetchEarnings(), 1000);
      } else {
        showToast(data.error || "Claim failed", "error");
      }
    } catch {
      showToast("Claim failed", "error");
    } finally {
      setClaiming(false);
    }
  };

  const referralUrl = typeof window !== "undefined" && publicKey
    ? `${window.location.origin}/create?ref=${publicKey.toString()}`
    : "";

  const shareText = `🚀 Create your own meme coin in seconds on BluPrint!\nUse my promo code: ${promoCode}\n👇`;

  const copyCode = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    showToast("Promo code copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrl = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopiedUrl(true);
    showToast("Referral link copied!", "success");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n" + referralUrl)}`, "_blank");
  };

  const shareOnTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + referralUrl)}`, "_blank");
  };

  const progressToNext = nextMilestone
    ? Math.min(100, (totalReferrals / nextMilestone) * 100)
    : 100;

  if (!mounted) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col relative">
        
        {/* BLUR OVERLAY - TÜM SAYFAYI KAPLAR */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-7xl mb-4 animate-pulse">🔒</div>
            </motion.div>
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-3">
              Coming Soon
            </div>
            <div className="text-gray-300 text-sm leading-relaxed">
              🚀 Our referral program is under development.
            </div>
            <div className="text-gray-500 text-xs mt-2">
              Invite friends and earn rewards — launching soon!
            </div>
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
              </span>
              <span className="text-xs text-gray-500">Stay tuned</span>
            </div>
          </div>
        </div>

        {/* ORİJİNAL İÇERİK - ARKADA HAFİF GÖZÜKECEK */}
        <div className="opacity-20 pointer-events-none">
          <div className="max-w-4xl mx-auto px-4 py-12 w-full flex-1">

            {/* HEADER */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3">🔗 {t('ref_title')}</h1>
              <p className="text-gray-500 text-lg">{t('ref_desc')}</p>
            </motion.div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-center text-white shadow-lg">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold">{totalReferrals}</div>
                <div className="text-sm opacity-90">{t('ref_total')}</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-center text-white shadow-lg">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-3xl font-bold">{earnings.toFixed(4)} SOL</div>
                <div className="text-sm opacity-90">{t('ref_unclaimed')}</div>
                {earnings > 0 && (
                  <button onClick={handleClaim} disabled={claiming}
                    className="mt-3 bg-white/20 hover:bg-white/30 font-semibold py-2 px-4 rounded-xl transition text-sm">
                    {claiming ? t('ref_processing') : t('ref_claim')}
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-3xl font-bold text-green-600">0.05 SOL</div>
                <div className="text-sm text-gray-500">{t('ref_per')}</div>
              </div>
            </div>

            {/* MILESTONE PROGRESS */}
            {nextMilestone && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl p-6 mb-6 border border-purple-200 dark:border-purple-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">🎯 Next milestone: <strong>{nextMilestone} referrals</strong></span>
                  <span className="font-bold text-purple-600">{totalReferrals}/{nextMilestone}</span>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative"
                  >
                    <div className="absolute right-1 top-0 h-full flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </motion.div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  🏆 {nextMilestone - totalReferrals} more referrals to unlock next bonus!
                </p>
              </div>
            )}

            {/* MILESTONE CARDS */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-1">🏆 Milestone Bonuses</h3>
              <p className="text-sm text-gray-500 mb-4">Reach these milestones and earn automatic SOL bonuses!</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MILESTONES.map((m) => {
                  const info = milestones.find((mi) => mi.count === m.count);
                  const reached = info?.reached || false;
                  const bonusClaimed = info?.claimed || false;
                  const remaining = Math.max(0, m.count - totalReferrals);
                  return (
                    <div key={m.count} className={`rounded-xl p-4 text-center border-2 transition-all ${
                      bonusClaimed
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : reached
                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg shadow-yellow-500/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}>
                      <div className="text-3xl mb-1">{m.icon}</div>
                      <div className="font-bold text-xs text-gray-500 mb-1">{m.label}</div>
                      <div className="font-bold">{m.count} refs</div>
                      <div className="text-green-600 font-bold text-lg">+{m.bonus} SOL</div>
                      <div className={`text-xs mt-2 font-medium ${
                        bonusClaimed ? "text-green-600" : reached ? "text-yellow-600" : "text-gray-400"
                      }`}>
                        {bonusClaimed ? "✅ Earned!" : reached ? "🎉 Unlocked!" : `${remaining} left`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PROMO CODE + SHARE */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-8 mb-8 border border-blue-200 dark:border-blue-800">
              <h2 className="text-2xl font-bold mb-2">🎁 Your Referral Code</h2>
              <p className="text-gray-500 text-sm mb-6">Share your code or link — earn 0.05 SOL for every token created!</p>

              {!publicKey ? (
                <p className="text-gray-500 text-center py-4">Connect your wallet to get your referral code.</p>
              ) : loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : hasToken && promoCode ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">PROMO CODE</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-6 py-4 font-mono text-2xl font-bold text-center tracking-widest border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400">
                        {promoCode}
                      </div>
                      <button onClick={copyCode}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-5 rounded-xl transition text-lg">
                        {copied ? "✅" : "📋"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">REFERRAL LINK</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-gray-500 border border-gray-200 dark:border-gray-700 truncate">
                        {referralUrl}
                      </div>
                      <button onClick={copyUrl}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition text-sm whitespace-nowrap">
                        {copiedUrl ? "✅" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">SHARE & EARN</p>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={shareOnTwitter}
                        className="flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl transition text-sm">
                        𝕏 Twitter
                      </button>
                      <button onClick={shareOnTelegram}
                        className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition text-sm">
                        ✈️ Telegram
                      </button>
                      <button onClick={shareOnWhatsApp}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition text-sm">
                        💬 WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      💡 Every person who creates a token with your code = <strong>0.05 SOL</strong> for you!
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Reach 10 referrals → +0.1 SOL bonus • 25 referrals → +0.2 SOL • 50 → +0.5 SOL • 100 → +1 SOL
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-5xl mb-4">🔒</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">Create your first token to unlock your referral code!</p>
                  <p className="text-sm text-gray-500 mb-6">Your unique promo code is generated after your first token creation.</p>
                  <a href="/create"
                    className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition">
                    ✨ Create Your First Token
                  </a>
                </div>
              )}
            </div>

            {/* LEADERBOARD */}
            {leaderboard.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-12 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">🏆 {t('ref_top')}</h3>
                <div className="space-y-2">
                  {leaderboard.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-500" : "bg-gray-600"
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="font-mono text-sm">{user.wallet.slice(0, 4)}...{user.wallet.slice(-4)}</span>
                      </div>
                      <div className="font-bold text-green-600">{user.referrals} {t('ref_referrals')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HOW IT WORKS */}
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-center mb-8">{t('ref_how_title')}</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="text-center p-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                      {step}️⃣
                    </div>
                    <h3 className="font-bold mb-2">{t(`ref_step${step}`)}</h3>
                    <p className="text-sm text-gray-500">{t(`ref_step${step}_desc`)}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <Footer />
        </div>
      </div>

      {/* MILESTONE POPUP */}
      <AnimatePresence>
        {animateMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 text-center shadow-2xl min-w-64">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-lg font-bold">Milestone Reached!</div>
            <div className="text-sm opacity-90 mt-1">{totalReferrals} referrals — bonus added!</div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}