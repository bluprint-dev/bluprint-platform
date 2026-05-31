"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

// ─── Types ───────────────────────────────────────────────────────────────────

type EarningsData = {
  pending: number;
  claimed: number;
  referralCount: number;
  code: string | null;
  milestones: { count: number; bonus: number; reached: boolean }[];
  nextMilestone: { count: number; remaining: number } | null;
};

type LeaderboardEntry = {
  rank: number;
  wallet: string;
  referrals: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shortWallet(w: string) {
  return w.slice(0, 4) + "…" + w.slice(-4);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toString() ?? null;

  // Data
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Claim
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Copy
  const [copied, setCopied] = useState(false);

  // ── Fetch earnings ────────────────────────────────────────────────────────

  const fetchEarnings = useCallback(async () => {
    if (!wallet) return;
    setIsLoading(true);
    try {
      const [earningsRes, lbRes] = await Promise.all([
        fetch(`/api/referral-earnings?wallet=${wallet}`),
        fetch(`/api/referral-leaderboard`),
      ]);
      const earningsData = await earningsRes.json();
      const lbData = await lbRes.json();

      if (earningsData.success) setEarnings(earningsData);
      if (lbData.success) setLeaderboard(lbData.leaderboard ?? []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (connected && wallet) fetchEarnings();
  }, [connected, wallet, fetchEarnings]);

  // ── Generate code if missing ──────────────────────────────────────────────

  const generateCode = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await fetch("/api/generate-promocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();
      if (data.success) fetchEarnings();
    } catch {}
  }, [wallet, fetchEarnings]);

  // ── Claim ─────────────────────────────────────────────────────────────────

  const handleClaim = useCallback(async () => {
    if (!wallet || !earnings || earnings.pending < 0.01) return;
    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(false);

    try {
      const res = await fetch("/api/claim-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();

      if (data.success) {
        setClaimSuccess(true);
        await fetchEarnings();
        setTimeout(() => setClaimSuccess(false), 4000);
      } else {
        setClaimError(data.error ?? "Claim failed");
      }
    } catch {
      setClaimError("Network error");
    } finally {
      setIsClaiming(false);
    }
  }, [wallet, earnings, fetchEarnings]);

  // ── Copy referral link ────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    if (!earnings?.code) return;
    const link = `${window.location.origin}/create?ref=${earnings.code}`;
    copyToClipboard(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [earnings?.code]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const referralLink = earnings?.code
    ? `${typeof window !== "undefined" ? window.location.origin : "https://bluprint.fun"}/create?ref=${earnings.code}`
    : null;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Referral Program</h1>
            <p className="text-gray-400 text-sm mt-1">
              Share your code → friend creates a token → you earn <span className="text-white font-semibold">0.05 SOL</span>
            </p>
          </div>

          {/* Not connected */}
          {!connected && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-gray-400 text-sm">Connect your wallet to view your referral stats</p>
            </div>
          )}

          {connected && isLoading && (
            <div className="text-center text-gray-500 text-sm py-8">Loading…</div>
          )}

          {connected && !isLoading && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Referrals", value: earnings?.referralCount ?? 0 },
                  { label: "Pending SOL", value: (earnings?.pending ?? 0).toFixed(4) },
                  { label: "Claimed SOL", value: (earnings?.claimed ?? 0).toFixed(4) },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                    <div className="text-2xl font-black text-white">{s.value}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Referral code box */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
                <div className="text-sm text-gray-400 font-medium">Your referral code</div>

                {earnings?.code ? (
                  <>
                    {/* Code pill */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-black/40 rounded-xl px-4 py-3 font-mono text-white text-lg font-bold tracking-widest">
                        {earnings.code}
                      </div>
                      <button
                        onClick={handleCopy}
                        className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors shrink-0"
                      >
                        {copied ? "Copied!" : "Copy link"}
                      </button>
                    </div>

                    {/* Full link */}
                    {referralLink && (
                      <div className="text-xs text-gray-600 font-mono break-all">
                        {referralLink}
                      </div>
                    )}

                    {/* Share buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Create a token on bluprint.fun and let's degenerate together 🚀\n\nUse my code: ${earnings.code}\n${referralLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] text-xs font-medium transition-colors"
                      >
                        Share on X
                      </a>
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(referralLink ?? "")}&text=${encodeURIComponent(`Use my code ${earnings.code} and create a token on bluprint.fun — you earn, I earn 🚀`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0088CC]/10 hover:bg-[#0088CC]/20 text-[#0088CC] text-xs font-medium transition-colors"
                      >
                        Share on Telegram
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-gray-500 text-sm">Create your first token to unlock your referral code</p>
                    <div className="flex gap-2 justify-center">
                      <a
                        href="/create"
                        className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Create Token
                      </a>
                      {/* Manuel generate (edge case) */}
                      <button
                        onClick={generateCode}
                        className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                      >
                        Generate Code
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Claim box */}
              {earnings && earnings.pending > 0 && (
                <div className="rounded-2xl border border-[#ff2d95]/20 bg-[#ff2d95]/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-xl">{earnings.pending.toFixed(4)} SOL</div>
                      <div className="text-gray-400 text-xs mt-0.5">Ready to claim</div>
                    </div>
                    <button
                      onClick={handleClaim}
                      disabled={isClaiming || earnings.pending < 0.01}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,45,149,0.3)] transition-all"
                    >
                      {isClaiming ? "Claiming…" : "Claim SOL"}
                    </button>
                  </div>

                  {claimError && (
                    <div className="text-red-400 text-xs">{claimError}</div>
                  )}
                  {claimSuccess && (
                    <div className="text-green-400 text-xs">🎉 SOL sent to your wallet!</div>
                  )}
                  {earnings.pending < 0.01 && (
                    <div className="text-gray-600 text-xs">Minimum claim: 0.01 SOL</div>
                  )}
                </div>
              )}

              {/* Milestones */}
              {earnings && earnings.milestones.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
                  <div className="text-sm text-gray-400 font-medium">Milestones</div>
                  <div className="space-y-2">
                    {earnings.milestones.map((m) => (
                      <div key={m.count} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${m.reached ? "bg-green-500" : "bg-white/10"}`}>
                            {m.reached ? "✓" : ""}
                          </div>
                          <span className={`text-sm ${m.reached ? "text-white" : "text-gray-500"}`}>
                            {m.count} referrals
                          </span>
                        </div>
                        <span className={`text-sm font-mono ${m.reached ? "text-green-400" : "text-gray-600"}`}>
                          +{m.bonus} SOL
                        </span>
                      </div>
                    ))}
                  </div>
                  {earnings.nextMilestone && (
                    <div className="text-gray-600 text-xs mt-1">
                      {earnings.nextMilestone.remaining} more referral{earnings.nextMilestone.remaining !== 1 ? "s" : ""} to next milestone
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
              <div className="text-sm text-gray-400 font-medium">Top Referrers</div>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry) => {
                  const isMe = wallet && entry.wallet === wallet;
                  return (
                    <div
                      key={entry.wallet}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl ${isMe ? "bg-[#ff2d95]/10 border border-[#ff2d95]/20" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-mono w-6 text-center ${entry.rank <= 3 ? "text-yellow-400 font-bold" : "text-gray-600"}`}>
                          {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                        </span>
                        <span className={`text-sm font-mono ${isMe ? "text-white font-semibold" : "text-gray-400"}`}>
                          {shortWallet(entry.wallet)}
                          {isMe && <span className="text-[#ff2d95] ml-1">(you)</span>}
                        </span>
                      </div>
                      <span className="text-sm text-white font-semibold">
                        {entry.referrals} refs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}