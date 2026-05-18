"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../lib/i18n-provider";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

interface Activity {
  id: string;
  type: "token" | "vip" | "premium" | "referral" | "announcement";
  wallet: string;
  details: {
    tokenName?: string;
    tokenSymbol?: string;
    amount?: number;
    rank?: number;
  };
  timestamp: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export default function LivePage() {
  const { t } = useI18n();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements] = useState<Announcement[]>([
    { id: "1", title: t("live_announcement_launch_title"), content: t("live_announcement_launch_desc"), createdAt: Date.now() },
    { id: "2", title: t("live_announcement_referral_title"), content: t("live_announcement_referral_desc"), createdAt: Date.now() - 86400000 },
    { id: "3", title: t("live_announcement_vip_title"), content: t("live_announcement_vip_desc"), createdAt: Date.now() - 172800000 },
  ]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activity");
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "token": return "🔥";
      case "vip": return "👑";
      case "premium": return "⭐";
      case "referral": return "💰";
      case "announcement": return "📢";
      default: return "📌";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "token": return "text-orange-500";
      case "vip": return "text-yellow-500";
      case "premium": return "text-blue-400";
      case "referral": return "text-green-500";
      case "announcement": return "text-cyan-500";
      default: return "text-gray-400";
    }
  };

  const getActivityMessage = (activity: Activity) => {
    const walletShort = `${activity.wallet.slice(0, 6)}...${activity.wallet.slice(-4)}`;
    switch (activity.type) {
      case "token":
        return `${t("live_feed_new_token")} "${activity.details.tokenName}" ${t("live_feed_created_by")} ${walletShort}`;
      case "vip":
        return `${walletShort} ${t("live_feed_became_vip")}`;
      case "premium":
        return `${walletShort} ${t("live_feed_joined_premium")}`;
      case "referral":
        return `${walletShort} ${t("live_feed_earned")} ${activity.details.amount} ${t("live_feed_from_referral")}`;
      default:
        return "Activity occurred";
    }
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-950">
        <div className="pt-6 px-6">
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">{t("live_feed_title")}</h1>
            <p className="text-gray-500 text-sm">{t("live_feed_subtitle")}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <h2 className="font-semibold text-white">{t("live_feed_activity_title")}</h2>
                </div>
                <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                  <AnimatePresence>
                    {activities.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">{t("live_feed_no_activity")}</div>
                    ) : (
                      activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="px-4 py-3 hover:bg-gray-800/50 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`text-xl ${getActivityColor(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-300">{getActivityMessage(activity)}</p>
                              <p className="text-xs text-gray-600 mt-1">{formatTime(activity.timestamp)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <h2 className="font-semibold text-white">{t("live_feed_announcements_title")}</h2>
                </div>
                <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-cyan-500 text-sm">📢</span>
                        <h3 className="font-medium text-white text-sm">{ann.title}</h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{ann.content}</p>
                      <p className="text-xs text-gray-600 mt-2">{formatTime(ann.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}