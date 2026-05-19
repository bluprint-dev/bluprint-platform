"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../lib/i18n-provider";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useToast } from "../components/ToastProvider";

interface Stats {
  total: number;
  vip: number;
  premium: number;
  maxLimit: number;
  vipLimit: number;
  launchReady: boolean;
}

function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}</>;
}

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
    </span>
  );
}

export default function PreregisterPage() {
  const { t } = useI18n();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJoins, setRecentJoins] = useState(0);

  useEffect(() => {
    fetchStats();
    if (publicKey) checkRegistration();
  }, [publicKey]);

  useEffect(() => {
    const n = Math.floor(Math.random() * 8) + 3;
    setRecentJoins(n);
    const t = setInterval(() => {
      setRecentJoins(Math.floor(Math.random() * 8) + 3);
    }, 12000);
    return () => clearInterval(t);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/preregister");
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) { console.error(err); }
  };

  const checkRegistration = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`/api/preregister?wallet=${publicKey.toString()}`);
      const data = await res.json();
      if (data.success && data.registered) {
        setRegistered(true);
        setUserTier(data.tier);
      }
    } catch (err) { console.error(err); }
  };

  const handleRegister = async () => {
    if (!publicKey) { setVisible(true); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/preregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toString() }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistered(true);
        setUserTier(data.tier);
        showToast(`🎉 ${t("preregister_success")} ${data.tier.toUpperCase()}! ${t("preregister_rank")} #${data.rank}`, "success");
        fetchStats();
      } else {
        showToast(`❌ ${data.error}`, "error");
      }
    } catch (err: any) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = stats ? Math.min((stats.total / stats.maxLimit) * 100, 100) : 0;
  const vipProgressPercent = stats ? Math.min((stats.vip / stats.vipLimit) * 100, 100) : 0;
  const spotsLeft = stats ? stats.maxLimit - stats.total : 2000;
  const vipSpotsLeft = stats ? Math.max(stats.vipLimit - stats.vip, 0) : 500;
  const isVipFull = stats ? stats.vip >= stats.vipLimit : false;
  const isFull = stats ? stats.total >= stats.maxLimit : false;

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-[#06060f] overflow-hidden">

        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 pt-20 sm:pt-24 max-w-5xl mx-auto px-3 sm:px-4 pb-20">

          <AnimatePresence mode="wait">
            <motion.div
              key={recentJoins}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-center mb-8"
            >
              <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-700/60 rounded-full px-4 py-2 text-xs">
                <LivePulse />
                <span className="text-gray-400">
                  <span className="text-white font-bold">{recentJoins} {t("preregister_people")}</span> {t("preregister_joined_recent")}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">{t("preregister_badge")}</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl font-black leading-none mb-4">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                BluPrint
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("preregister_title")}
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              {t("preregister_only")} <span className="text-white font-bold">2,000 {t("preregister_spots")}</span>.
              {t("preregister_first")} <span className="text-yellow-400 font-bold">500 {t("preregister_members")}</span> {t("preregister_unlock")}{" "}
              <span className="text-yellow-400 font-bold">VIP {t("preregister_status")}</span> {t("preregister_rewards")}
            </motion.p>
          </div>

          {stats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-3 mb-10 max-w-lg mx-auto">
              {[
                { label: t("preregister_registered"), value: stats.total, color: "text-white", suffix: `/ ${stats.maxLimit}` },
                { label: "VIP", value: stats.vip, color: "text-yellow-400", suffix: `/ ${stats.vipLimit}` },
                { label: t("preregister_premium"), value: stats.premium, color: "text-blue-400", suffix: "" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-4 text-center">
                  <div className={`text-2xl font-black ${s.color} font-mono`}>
                    <CountUp target={s.value} />
                    <span className="text-xs text-gray-600 font-normal">{s.suffix}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {stats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
              
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium">{t("preregister_total_registration")}</span>
                  <span className="text-white font-bold font-mono">{spotsLeft} {t("preregister_spots_left")}</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700 mt-1">
                  <span>0</span>
                  <span>{stats.maxLimit.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-yellow-500/80 font-medium">👑 VIP {t("preregister_spots")}</span>
                  <span className={`font-bold font-mono ${isVipFull ? "text-red-400" : "text-yellow-400"}`}>
                    {isVipFull ? t("preregister_full") : `${vipSpotsLeft} ${t("preregister_left")}`}
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${vipProgressPercent}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-5 mb-10">

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-yellow-500/50 to-orange-500/50 rounded-2xl blur-sm opacity-40 group-hover:opacity-70 transition duration-500" />
              <div className="relative bg-gray-950/90 rounded-2xl p-6 border border-yellow-500/20 group-hover:border-yellow-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-yellow-500/20">
                      👑
                    </div>
                    <div>
                      <div className="text-white font-black text-lg">VIP {t("preregister_access")}</div>
                      <div className="text-yellow-500/70 text-xs">{t("preregister_first_members")}</div>
                    </div>
                  </div>
                  {isVipFull
                    ? <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full font-bold">{t("preregister_full")}</span>
                    : <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded-full font-bold">{vipSpotsLeft} {t("preregister_left")}</span>
                  }
                </div>

                <ul className="space-y-2.5">
                  {[
                    t("preregister_vip_benefit1"),
                    t("preregister_vip_benefit2"),
                    t("preregister_vip_benefit3"),
                    t("preregister_vip_benefit4"),
                    t("preregister_vip_benefit5"),
                    t("preregister_vip_benefit6"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <span className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 text-[10px] flex-shrink-0">✓</span>
                      <span className={i === 5 ? "text-gray-500 text-xs" : "text-gray-300"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-blue-500/50 to-cyan-500/50 rounded-2xl blur-sm opacity-40 group-hover:opacity-70 transition duration-500" />
              <div className="relative bg-gray-950/90 rounded-2xl p-6 border border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                      ⭐
                    </div>
                    <div>
                      <div className="text-white font-black text-lg">{t("preregister_premium_access")}</div>
                      <div className="text-blue-400/70 text-xs">{t("preregister_premium_members")}</div>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold">
                    {stats ? stats.maxLimit - stats.vipLimit - stats.premium : 1500} {t("preregister_left")}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {[
                    t("preregister_premium_benefit1"),
                    t("preregister_premium_benefit2"),
                    t("preregister_premium_benefit3"),
                    t("preregister_premium_benefit4"),
                    t("preregister_premium_benefit5"),
                    t("preregister_premium_benefit6"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-[10px] flex-shrink-0">✓</span>
                      <span className={i === 5 ? "text-gray-500 text-xs" : "text-gray-300"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 mb-8 max-w-2xl mx-auto">
            <span className="text-amber-400 text-lg flex-shrink-0">⚡</span>
            <p className="text-amber-300/80 text-sm leading-relaxed">
              {t("preregister_activate_warning")}
              <span className="text-amber-500/60 text-xs block mt-1">{t("preregister_inactive_warning")}</span>
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="max-w-md mx-auto">

            {!connected ? (
              <div className="text-center">
                <button onClick={() => setVisible(true)}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-5 rounded-2xl transition-all duration-200 text-lg shadow-2xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]">
                  <span className="relative z-10">{t("preregister_connect_wallet")}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                </button>
                <p className="text-gray-600 text-xs mt-3">{t("preregister_no_fees")}</p>
              </div>
            ) : registered ? (
              <div className="bg-gray-900/80 border border-gray-700/60 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">
                  {userTier === "vip" ? "👑" : "⭐"}
                </div>
                <div className="text-green-400 font-bold text-sm mb-1 uppercase tracking-widest">{t("preregister_access_secured")}</div>
                <div className={`text-3xl font-black mb-3 ${userTier === "vip" ? "text-yellow-400" : "text-blue-400"}`}>
                  {userTier?.toUpperCase()} {t("preregister_member")}
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  userTier === "vip"
                    ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}>
                  {userTier === "vip"
                    ? `👑 ${t("preregister_activate_vip")}`
                    : `⭐ ${t("preregister_activate_premium")}`}
                </div>
              </div>
            ) : isFull ? (
              <div className="bg-gray-900/80 border border-red-500/20 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-3">🔒</div>
                <div className="text-red-400 font-bold text-lg">{t("preregister_all_spots_filled")}</div>
                <p className="text-gray-500 text-sm mt-2">{t("preregister_early_access_closed")}</p>
              </div>
            ) : (
              <div>
                <button onClick={handleRegister} disabled={loading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 disabled:opacity-60 text-white font-black py-5 rounded-2xl transition-all duration-200 text-lg shadow-2xl shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("preregister_securing")}
                    </span>
                  ) : (
                    <span className="relative z-10">
                      🚀 {t("preregister_secure_spot")}
                    </span>
                  )}
                </button>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
                  <span>✓ {t("preregister_no_fees_short")}</span>
                  <span>✓ {t("preregister_no_kyc")}</span>
                  <span>✓ {t("preregister_instant")}</span>
                </div>
                {!isVipFull && (
                  <p className="text-center text-yellow-500/70 text-xs mt-3">
                    👑 {t("preregister_vip_warning")} {vipSpotsLeft} {t("preregister_spots_left")}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </PageTransition>
  );
}