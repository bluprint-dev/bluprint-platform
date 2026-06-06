"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

// ─── TYPES ───────────────────────────────────────────────────
interface TokenFee {
  genesisAccount: string;
  mintAddress: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  pendingSol: string;
  pending: string;
  accrued: string;
  claimed: string;
}

interface RewardsData {
  tokens: TokenFee[];
  totalPendingSol: number;
}

const F = {
  mono: "'Courier New', 'Roboto Mono', monospace",
  display: "'Space Grotesk', 'Inter', sans-serif",
};

// ─── TOKEN AVATAR ─────────────────────────────────────────────
function TokenAvatar({ token }: { token: TokenFee }) {
  if (token.imageUrl) {
    return (
      <img
        src={token.imageUrl}
        alt={token.symbol}
        style={{
          width: 48, height: 48, borderRadius: "50%", objectFit: "cover",
          border: "2px solid rgba(153,69,255,0.3)", flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #9945FF, #14F195)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, fontWeight: 900, color: "#fff",
      border: "2px solid rgba(153,69,255,0.3)",
    }}>
      {token.symbol.charAt(0)}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function CreatorRewardsPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null); // genesisAccount of token being claimed
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const wallet = publicKey?.toBase58();

  // ─── FETCH creator'ın tüm tokenlarının pending fee'lerini ──
  const fetchRewards = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    setClaimError("");
    try {
      // 1. Creator'ın tokenlarını çek
      const tokensRes = await fetch(`/api/user-tokens?wallet=${wallet}`);
      const tokensJson = await tokensRes.json();

      if (!tokensJson.success || !tokensJson.tokens?.length) {
        setData({ tokens: [], totalPendingSol: 0 });
        setLoading(false);
        return;
      }

      // 2. Her token için pending fee'yi sorgula
      const feePromises = tokensJson.tokens.map(async (token: any) => {
        try {
          const res = await fetch(
            `/api/bonding-curve/claim?genesisAccount=${token.genesisAccount ?? token.mint}`
          );
          const json = await res.json();
          if (!json.success) return null;

          return {
            genesisAccount: token.genesisAccount ?? token.mint,
            mintAddress: token.mint,
            name: token.name ?? "Unknown",
            symbol: token.symbol ?? "???",
            imageUrl: token.imageUrl ?? "",
            pendingSol: json.fees?.pendingSol ?? "0.000000",
            pending: json.fees?.pending ?? "0",
            accrued: json.fees?.accrued ?? "0",
            claimed: json.fees?.claimed ?? "0",
          } as TokenFee;
        } catch {
          return null;
        }
      });

      const fees = (await Promise.all(feePromises)).filter(Boolean) as TokenFee[];
      const totalPendingSol = fees.reduce((acc, t) => acc + Number(t.pendingSol), 0);

      setData({ tokens: fees, totalPendingSol });
    } catch {
      setClaimError("Failed to fetch rewards");
    }
    setLoading(false);
  }, [wallet]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // ─── CLAIM ────────────────────────────────────────────────
  const handleClaim = async (token: TokenFee) => {
    if (!wallet || Number(token.pending) === 0) return;
    setClaiming(token.genesisAccount);
    setClaimError("");
    setClaimSuccess(null);

    try {
      const res = await fetch("/api/bonding-curve/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genesisAccount: token.genesisAccount,
          creatorWallet: wallet,
          mintAddress: token.mintAddress,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setClaimError(json.error ?? "Claim failed");
        setClaiming(null);
        return;
      }

      // TX imzala ve gönder
      const tx = Transaction.from(Buffer.from(json.transaction, "base64"));
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      setClaimSuccess(token.genesisAccount);
      await fetchRewards();
    } catch (err: any) {
      setClaimError(err?.message ?? "Transaction failed");
    }
    setClaiming(null);
  };

  // ─── CLAIM ALL ────────────────────────────────────────────
  const handleClaimAll = async () => {
    if (!data) return;
    const claimable = data.tokens.filter((t) => Number(t.pending) > 0);
    for (const token of claimable) {
      await handleClaim(token);
    }
  };

  const claimableTokens = data?.tokens.filter((t) => Number(t.pending) > 0) ?? [];
  const totalPending = data?.totalPendingSol ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #07070f 0%, #0d0617 50%, #070b0f 100%)",
        fontFamily: F.display,
        position: "relative",
      }}
    >
      {/* ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(153,69,255,0.08) 0%, transparent 70%)",
          animation: "blob1 20s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-5%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,241,149,0.06) 0%, transparent 70%)",
          animation: "blob2 25s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(153,69,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.025) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 20,
            background: "rgba(20,241,149,0.06)",
            border: "1px solid rgba(20,241,149,0.15)",
            marginBottom: 14,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#14F195", boxShadow: "0 0 6px #14F195",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ color: "rgba(20,241,149,0.7)", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em" }}>
              CREATOR_REWARDS
            </span>
          </div>
          <h1 style={{
            margin: 0, color: "#fff",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 900, letterSpacing: "-0.02em",
          }}>
            Creator <span style={{ color: "#14F195", textShadow: "0 0 20px rgba(20,241,149,0.4)" }}>Rewards</span>
          </h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.3)", fontFamily: F.mono, fontSize: 12 }}>
            Claim swap fee earnings from your launched tokens
          </p>
        </div>

        {/* ── NOT CONNECTED ── */}
        {!connected && (
          <div style={{
            background: "linear-gradient(135deg, rgba(153,69,255,0.08), rgba(20,241,149,0.03))",
            border: "1px solid rgba(153,69,255,0.2)",
            borderRadius: 20, padding: "48px 32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 16, filter: "drop-shadow(0 0 16px rgba(153,69,255,0.4))" }}>◈</div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: F.mono, fontSize: 13, marginBottom: 24 }}>
              Connect your wallet to see creator rewards
            </p>
            <button
              onClick={() => setVisible(true)}
              style={{
                padding: "12px 28px", borderRadius: 12,
                background: "linear-gradient(135deg, #9945FF, #14F195)",
                border: "none", color: "#07070f",
                fontWeight: 900, fontSize: 14, fontFamily: F.mono,
                letterSpacing: "0.08em", cursor: "pointer",
                boxShadow: "0 0 25px rgba(153,69,255,0.3)",
              }}
            >
              CONNECT_WALLET
            </button>
          </div>
        )}

        {/* ── CONNECTED ── */}
        {connected && (
          <>
            {/* Total pending card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(20,241,149,0.08) 0%, rgba(153,69,255,0.05) 100%)",
              border: "1px solid rgba(20,241,149,0.2)",
              borderRadius: 20, padding: "24px 28px",
              marginBottom: 24, position: "relative", overflow: "hidden",
            }}>
              {/* top scan line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "linear-gradient(90deg, transparent, #14F195, transparent)",
                opacity: 0.5,
              }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em", marginBottom: 6 }}>
                    TOTAL_PENDING_REWARDS
                  </p>
                  <p style={{
                    margin: 0, color: "#14F195", fontFamily: F.mono,
                    fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900,
                    textShadow: "0 0 30px rgba(20,241,149,0.5)",
                  }}>
                    {loading ? "···" : `${totalPending.toFixed(6)} SOL`}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.2)", fontFamily: F.mono, fontSize: 10 }}>
                    from {claimableTokens.length} token{claimableTokens.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {claimableTokens.length > 1 && (
                  <button
                    onClick={handleClaimAll}
                    disabled={!!claiming || loading}
                    style={{
                      padding: "12px 24px", borderRadius: 12,
                      background: "linear-gradient(135deg, #14F195, #0fa96a)",
                      border: "none", color: "#07070f",
                      fontWeight: 900, fontSize: 13, fontFamily: F.mono,
                      letterSpacing: "0.08em", cursor: claiming ? "not-allowed" : "pointer",
                      opacity: claiming ? 0.5 : 1,
                      boxShadow: "0 0 25px rgba(20,241,149,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    {claiming ? "CLAIMING..." : "CLAIM_ALL"}
                  </button>
                )}
              </div>
            </div>

            {/* Error / success */}
            {claimError && (
              <div style={{
                padding: "12px 16px", borderRadius: 10, marginBottom: 16,
                background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)",
                color: "#ff4444", fontFamily: F.mono, fontSize: 12,
              }}>
                ⚠ {claimError}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{
                textAlign: "center", padding: "48px 0",
                color: "rgba(153,69,255,0.5)", fontFamily: F.mono, fontSize: 12,
                letterSpacing: "0.1em",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>◈</div>
                <p style={{ margin: 0 }}>FETCHING_REWARDS...</p>
              </div>
            )}

            {/* No tokens */}
            {!loading && data?.tokens.length === 0 && (
              <div style={{
                background: "rgba(153,69,255,0.04)", border: "1px solid rgba(153,69,255,0.1)",
                borderRadius: 16, padding: "48px 32px", textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, color: "rgba(153,69,255,0.3)" }}>◈</div>
                <p style={{ color: "rgba(255,255,255,0.25)", fontFamily: F.mono, fontSize: 12, letterSpacing: "0.08em" }}>
                  NO_TOKENS_FOUND — launch a token to start earning
                </p>
              </div>
            )}

            {/* Token list */}
            {!loading && data && data.tokens.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* header row */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto auto",
                  gap: 16, padding: "8px 16px",
                  color: "rgba(153,69,255,0.4)", fontFamily: F.mono,
                  fontSize: 9, letterSpacing: "0.12em",
                  borderBottom: "1px solid rgba(153,69,255,0.08)",
                  marginBottom: 4,
                }}>
                  <span>TOKEN</span>
                  <span style={{ textAlign: "right" }}>ACCRUED</span>
                  <span style={{ textAlign: "right" }}>PENDING</span>
                  <span style={{ textAlign: "right" }}>ACTION</span>
                </div>

                {data.tokens.map((token) => {
                  const isPending = Number(token.pending) > 0;
                  const isClaiming = claiming === token.genesisAccount;
                  const isSuccess = claimSuccess === token.genesisAccount;

                  return (
                    <div key={token.genesisAccount} style={{
                      background: isPending
                        ? "linear-gradient(135deg, rgba(20,241,149,0.05) 0%, rgba(153,69,255,0.04) 100%)"
                        : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isPending ? "rgba(20,241,149,0.15)" : "rgba(153,69,255,0.08)"}`,
                      borderRadius: 16, padding: "16px 20px",
                      display: "grid", gridTemplateColumns: "1fr auto auto auto",
                      gap: 16, alignItems: "center",
                      transition: "border-color 0.2s",
                    }}>
                      {/* Token info */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <TokenAvatar token={token} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {token.name}
                            </span>
                            <span style={{
                              color: isPending ? "#14F195" : "rgba(153,69,255,0.6)",
                              fontFamily: F.mono, fontSize: 10, fontWeight: 700,
                              background: isPending ? "rgba(20,241,149,0.08)" : "rgba(153,69,255,0.08)",
                              padding: "1px 6px", borderRadius: 4, flexShrink: 0,
                            }}>${token.symbol}</span>
                          </div>
                          <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: F.mono, fontSize: 9 }}>
                            {token.genesisAccount.slice(0, 8)}...{token.genesisAccount.slice(-6)}
                          </span>
                        </div>
                      </div>

                      {/* Accrued */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em" }}>TOTAL</p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontFamily: F.mono, fontSize: 13, fontWeight: 700 }}>
                          {(Number(token.accrued) / 1e9).toFixed(4)}
                        </p>
                      </div>

                      {/* Pending */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em" }}>PENDING</p>
                        <p style={{
                          margin: 0, fontFamily: F.mono, fontSize: 13, fontWeight: 900,
                          color: isPending ? "#14F195" : "rgba(255,255,255,0.2)",
                          textShadow: isPending ? "0 0 12px rgba(20,241,149,0.4)" : "none",
                        }}>
                          {Number(token.pendingSol).toFixed(4)} SOL
                        </p>
                      </div>

                      {/* Claim button */}
                      <div>
                        {isSuccess ? (
                          <div style={{
                            padding: "8px 14px", borderRadius: 10,
                            background: "rgba(20,241,149,0.1)",
                            border: "1px solid rgba(20,241,149,0.3)",
                            color: "#14F195", fontFamily: F.mono, fontSize: 11,
                            fontWeight: 700, letterSpacing: "0.06em", textAlign: "center",
                          }}>✓ CLAIMED</div>
                        ) : (
                          <button
                            onClick={() => handleClaim(token)}
                            disabled={!isPending || !!claiming}
                            style={{
                              padding: "8px 16px", borderRadius: 10,
                              background: isPending
                                ? "linear-gradient(135deg, #9945FF, #14F195)"
                                : "rgba(255,255,255,0.04)",
                              border: isPending ? "none" : "1px solid rgba(153,69,255,0.1)",
                              color: isPending ? "#07070f" : "rgba(255,255,255,0.2)",
                              fontWeight: 900, fontSize: 11, fontFamily: F.mono,
                              letterSpacing: "0.08em", cursor: isPending && !claiming ? "pointer" : "not-allowed",
                              opacity: isClaiming ? 0.6 : 1,
                              boxShadow: isPending ? "0 0 16px rgba(153,69,255,0.25)" : "none",
                              transition: "all 0.2s", whiteSpace: "nowrap",
                            }}
                          >
                            {isClaiming ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>◈</span>
                                TX...
                              </span>
                            ) : isPending ? "CLAIM" : "EMPTY"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info box */}
            <div style={{
              marginTop: 32, padding: "16px 20px", borderRadius: 14,
              background: "rgba(153,69,255,0.04)",
              border: "1px solid rgba(153,69,255,0.1)",
            }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.2)", fontFamily: F.mono, fontSize: 10, lineHeight: 1.8 }}>
                ◈ Creator fee: <span style={{ color: "rgba(153,69,255,0.7)" }}>0.60%</span> per swap → accrued on-chain in bonding curve bucket<br />
                ◈ Protocol fee: <span style={{ color: "rgba(153,69,255,0.7)" }}>0.50%</span> per swap → Metaplex<br />
                ◈ Fees accumulate automatically — claim anytime, no expiry
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,40px)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,60px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}