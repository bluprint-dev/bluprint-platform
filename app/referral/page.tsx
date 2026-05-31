"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface EarningsData {
  pending: number;
  claimed: number;
  referralCount: number;
  code: string;
  milestones: {
    referrals: number;
    bonus: number;
    reached: boolean;
    claimed: boolean;
  }[];
}

const MILESTONES = [
  { referrals: 5, bonus: 0.05, label: "+0.05◎" },
  { referrals: 10, bonus: 0.1, label: "+0.1◎" },
  { referrals: 25, bonus: 0.25, label: "+0.25◎" },
  { referrals: 50, bonus: 0.5, label: "+0.5◎" },
  { referrals: 100, bonus: 1, label: "+1◎" },
  { referrals: 250, bonus: 2.5, label: "+2.5◎" },
  { referrals: 500, bonus: 5, label: "+5◎" },
  { referrals: 1000, bonus: 10, label: "10◎ + VIP", isVip: true },
];

function getNextMilestone(count: number) {
  for (const m of MILESTONES) {
    if (count < m.referrals) return m;
  }
  return null;
}

function getPrevMilestone(count: number) {
  let prev = null;
  for (const m of MILESTONES) {
    if (count >= m.referrals) prev = m;
    else break;
  }
  return prev;
}

function getProgressPercent(count: number) {
  if (count === 0) return 0;
  const next = getNextMilestone(count);
  if (!next) return 100;
  const prev = getPrevMilestone(count);
  const base = prev ? prev.referrals : 0;
  return Math.min(100, ((count - base) / (next.referrals - base)) * 100);
}

export default function ReferralPage() {
  const { publicKey, connected } = useWallet();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);

  const wallet = publicKey?.toBase58();
  const refLink = data?.code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/create?ref=${data.code}`
    : "";

  const fetchEarnings = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/referral-earnings?wallet=${wallet}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
    setLoading(false);
  }, [wallet]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleCopy = (type: "code" | "link") => {
    const text = type === "code" ? data?.code ?? "" : refLink;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClaim = async () => {
    if (!wallet || !data || data.pending <= 0) return;
    setClaiming(true);
    setClaimError("");
    setClaimSuccess(false);
    try {
      const res = await fetch("/api/claim-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const json = await res.json();
      if (json.success) {
        setClaimSuccess(true);
        await fetchEarnings();
      } else {
        setClaimError(json.error || "Claim failed");
      }
    } catch {
      setClaimError("Network error");
    }
    setClaiming(false);
  };

  const shareOnX = () => {
    const text = encodeURIComponent(
      `Just launched my token on BluPrint 🚀\nUse my code to get started: ${refLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(
      `Launch your token on BluPrint 🚀 Use my referral: ${refLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${text}`, "_blank");
  };

  const nextMilestone = data ? getNextMilestone(data.referralCount) : null;
  const progressPercent = data ? getProgressPercent(data.referralCount) : 0;
  const prevMilestone = data ? getPrevMilestone(data.referralCount) : null;
  const toNext = nextMilestone && data
    ? nextMilestone.referrals - data.referralCount
    : 0;

  return (
    <div className="min-h-screen bg-[#0F0817]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap');

        :root {
          --purple: #9945FF;
          --green: #14F195;
          --dark: #0F0817;
          --card: rgba(255,255,255,0.04);
          --border: rgba(153,69,255,0.2);
          --border-green: rgba(20,241,149,0.25);
        }

        .glow-purple { box-shadow: 0 0 20px rgba(153,69,255,0.3), 0 0 40px rgba(153,69,255,0.1); }
        .glow-green { box-shadow: 0 0 20px rgba(20,241,149,0.4), 0 0 40px rgba(20,241,149,0.15); }
        .glow-text-green { text-shadow: 0 0 20px rgba(20,241,149,0.6); }
        .glow-text-purple { text-shadow: 0 0 20px rgba(153,69,255,0.6); }

        .glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(153,69,255,0.2);
          border-radius: 16px;
        }

        .claim-btn {
          background: linear-gradient(135deg, #9945FF, #14F195);
          border: none;
          border-radius: 12px;
          color: #0F0817;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .claim-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .claim-btn:active { transform: translateY(0) scale(0.98); }
        .claim-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .claim-btn.pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.2);
          animation: pulse-ring 1.8s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { opacity: 0.3; }
          50% { opacity: 0; }
          100% { opacity: 0; }
        }

        .copy-btn {
          background: rgba(153,69,255,0.1);
          border: 1px solid rgba(153,69,255,0.3);
          border-radius: 8px;
          color: #9945FF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          padding: 8px 16px;
        }
        .copy-btn:hover { background: rgba(153,69,255,0.2); border-color: rgba(153,69,255,0.5); }
        .copy-btn.copied { background: rgba(20,241,149,0.1); border-color: rgba(20,241,149,0.4); color: #14F195; }

        .share-btn {
          border-radius: 10px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .share-x {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
        }
        .share-x:hover { background: rgba(255,255,255,0.1); }
        .share-tg {
          background: rgba(0,136,204,0.1);
          border: 1px solid rgba(0,136,204,0.3);
          color: #29B6F6;
        }
        .share-tg:hover { background: rgba(0,136,204,0.2); }

        .input-field {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(153,69,255,0.25);
          border-radius: 10px;
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          padding: 12px 16px;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          cursor: text;
        }
        .input-field:focus { border-color: rgba(153,69,255,0.5); }

        /* Milestone track */
        .milestone-track {
          position: relative;
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          margin: 0 0 48px;
        }
        .milestone-fill {
          height: 100%;
          background: linear-gradient(90deg, #9945FF, #14F195);
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 12px rgba(20,241,149,0.5);
        }
        .milestone-dot {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(153,69,255,0.4);
          background: #0F0817;
          transition: all 0.3s;
        }
        .milestone-dot.reached {
          background: #14F195;
          border-color: #14F195;
          box-shadow: 0 0 10px rgba(20,241,149,0.8);
        }
        .milestone-dot.current {
          width: 16px;
          height: 16px;
          background: #9945FF;
          border-color: #9945FF;
          box-shadow: 0 0 14px rgba(153,69,255,0.9);
          animation: current-pulse 1.5s ease-in-out infinite;
        }
        @keyframes current-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(153,69,255,0.7); }
          50% { box-shadow: 0 0 20px rgba(153,69,255,1), 0 0 30px rgba(153,69,255,0.4); }
        }
        .milestone-label {
          position: absolute;
          top: 20px;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          white-space: nowrap;
          text-align: center;
        }
        .milestone-label.reached { color: #14F195; text-shadow: 0 0 8px rgba(20,241,149,0.5); }
        .milestone-label .count { display: block; font-size: 9px; opacity: 0.7; margin-bottom: 2px; }

        .vip-badge {
          background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(153,69,255,0.15));
          border: 1px solid rgba(255,215,0,0.4);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          animation: vip-shimmer 2s ease-in-out infinite;
        }
        @keyframes vip-shimmer {
          0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.3); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.7), 0 0 30px rgba(153,69,255,0.4); }
        }

        .bg-mesh {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .mesh-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
        }

        .stat-value {
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          font-size: 28px;
          line-height: 1;
        }

        .skeleton {
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Background mesh blobs */}
      <div className="bg-mesh">
        <div className="mesh-blob" style={{ width: 600, height: 600, background: "#9945FF", top: -100, left: -200 }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, background: "#14F195", bottom: 0, right: -100 }} />
        <div className="mesh-blob" style={{ width: 400, height: 400, background: "#9945FF", top: "50%", left: "40%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
            <div>
              <p style={{ color: "#9945FF", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>
                BluPrint
              </p>
              <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(24px, 5vw, 38px)", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>
                Referral <span style={{ color: "#14F195" }} className="glow-text-green">Program</span>
              </h1>
            </div>
            <WalletMultiButton style={{
              background: "rgba(153,69,255,0.15)",
              border: "1px solid rgba(153,69,255,0.4)",
              borderRadius: 12,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 14,
            }} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: "12px 0 0", maxWidth: 500 }}>
            Share your code → friend creates a token → you earn <span style={{ color: "#14F195", fontWeight: 600 }}>0.05 SOL</span> per launch
          </p>
        </div>

        {!connected ? (
          <div className="glass-card" style={{ padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", color: "#fff", fontSize: 22, margin: "0 0 12px" }}>
              Connect your wallet
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: "0 0 28px" }}>
              Connect to see your referral code, earnings, and milestones
            </p>
            <WalletMultiButton style={{
              background: "linear-gradient(135deg, #9945FF, #14F195)",
              border: "none",
              borderRadius: 12,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "#0F0817",
            }} />
          </div>
        ) : loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
            {[0,1,2].map(i => (
              <div key={i} className="glass-card" style={{ padding: 24 }}>
                <div className="skeleton" style={{ width: 80, height: 13, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: 120, height: 28 }} />
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>

              {/* Referrals */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(153,69,255,0.15)", border: "1px solid rgba(153,69,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9945FF" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>REFERRALS</span>
                </div>
                <div className="stat-value glow-text-purple" style={{ color: "#9945FF" }}>{data.referralCount}</div>
                {nextMilestone && (
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "8px 0 0" }}>
                    {toNext} more to next milestone
                  </p>
                )}
              </div>

              {/* Pending + Claim */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#14F195" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>PENDING</span>
                </div>
                <div className="stat-value glow-text-green" style={{ color: "#14F195", marginBottom: 16 }}>
                  {data.pending.toFixed(3)} ◎
                </div>
                <button
                  className={`claim-btn${data.pending > 0 ? " pulse" : ""}`}
                  onClick={handleClaim}
                  disabled={claiming || data.pending <= 0}
                  style={{ width: "100%", padding: "12px 0" }}
                >
                  {claiming ? "Claiming..." : data.pending > 0 ? `Claim ${data.pending.toFixed(3)} SOL` : "Nothing to claim"}
                </button>
                {claimError && <p style={{ color: "#ff6b6b", fontSize: 12, margin: "8px 0 0" }}>{claimError}</p>}
                {claimSuccess && <p style={{ color: "#14F195", fontSize: 12, margin: "8px 0 0" }}>✓ Claimed successfully!</p>}
              </div>

              {/* Claimed */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#FFD700" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>CLAIMED</span>
                </div>
                <div className="stat-value" style={{ color: "#FFD700" }}>{data.claimed.toFixed(3)} ◎</div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "8px 0 0" }}>
                  Total earned lifetime
                </p>
              </div>
            </div>

            {/* Referral Code & Share */}
            <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
              <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 20px", letterSpacing: "0.05em" }}>
                YOUR REFERRAL CODE
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 16, alignItems: "center" }}>
                {/* Code */}
                <div style={{ position: "relative" }}>
                  <div style={{ background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.3)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 900, color: "#9945FF", letterSpacing: "0.1em" }} className="glow-text-purple">
                      {data.code}
                    </span>
                    <button
                      className={`copy-btn${copied === "code" ? " copied" : ""}`}
                      onClick={() => handleCopy("code")}
                      style={{ padding: "6px 12px", flexShrink: 0 }}
                    >
                      {copied === "code" ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Link */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    className="input-field"
                    readOnly
                    value={refLink}
                    style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.5)" }}
                  />
                  <button
                    className={`copy-btn${copied === "link" ? " copied" : ""}`}
                    onClick={() => handleCopy("link")}
                    style={{ flexShrink: 0 }}
                  >
                    {copied === "link" ? "✓ Copied!" : "Copy link"}
                  </button>
                </div>
              </div>

              {/* Share buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="share-btn share-x" onClick={shareOnX}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.264 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </button>
                <button className="share-btn share-tg" onClick={shareOnTelegram}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Share on Telegram
                </button>
              </div>
            </div>

            {/* Milestone Track */}
            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>
                  MILESTONE ROADMAP
                </h3>
                {nextMilestone && (
                  <div style={{
                    background: "rgba(20,241,149,0.08)",
                    border: "1px solid rgba(20,241,149,0.25)",
                    borderRadius: 20,
                    padding: "6px 16px",
                    color: "#14F195",
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    ⚡ {toNext} more to unlock {nextMilestone.label}
                  </div>
                )}
                {!nextMilestone && (
                  <div style={{
                    background: "rgba(255,215,0,0.1)",
                    border: "1px solid rgba(255,215,0,0.4)",
                    borderRadius: 20,
                    padding: "6px 16px",
                    color: "#FFD700",
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    🏆 All milestones reached!
                  </div>
                )}
              </div>

              {/* Track */}
              <div style={{ position: "relative", paddingBottom: 60 }}>
                <div className="milestone-track">
                  <div
                    className="milestone-fill"
                    style={{ width: `${progressPercent}%` }}
                  />

                  {MILESTONES.map((m, i) => {
                    const pos = ((i + 1) / MILESTONES.length) * 100;
                    const reached = data.referralCount >= m.referrals;
                    const isCurrent = !reached && (i === 0 || data.referralCount >= MILESTONES[i - 1].referrals);
                    const isVip = m.referrals === 1000;

                    return (
                      <div key={m.referrals}>
                        <div
                          className={`milestone-dot${reached ? " reached" : ""}${isCurrent ? " current" : ""}`}
                          style={{ left: `${pos}%` }}
                        />
                        <div
                          className={`milestone-label${reached ? " reached" : ""}`}
                          style={{ left: `${pos}%` }}
                        >
                          <span className="count">{m.referrals}</span>
                          {isVip ? (
                            <span style={{ color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.8)", fontSize: 11 }}>
                              👑 VIP
                            </span>
                          ) : (
                            m.label
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VIP Legend */}
              <div style={{
                background: "linear-gradient(135deg, rgba(255,215,0,0.05), rgba(153,69,255,0.08))",
                border: "1px solid rgba(255,215,0,0.2)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}>
                <div className="vip-badge">👑</div>
                <div>
                  <p style={{ color: "#FFD700", fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>
                    1000 Referrals — VIP Status + 10 SOL
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
                    Reach 1000 referrals and contact us directly for exclusive VIP perks
                  </p>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 900, color: "#FFD700" }}>
                    {data.referralCount}
                  </span>
                  <span style={{ color: "rgba(255,215,0,0.4)", fontSize: 13 }}> / 1000</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Failed to load data. Try refreshing.</p>
            <button className="copy-btn" onClick={fetchEarnings} style={{ marginTop: 16 }}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}