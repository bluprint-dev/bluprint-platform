"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import type { DexToken } from "@/types/dex";
import type { BondingCurveInfo } from "@/hooks/useBondingCurveInfo";

type TradePanelProps = {
  token: DexToken | null;
  isBuy: boolean;
  amount: string;
  isSwapping: boolean;
  swapError: string;
  curveInfo?: BondingCurveInfo | null;
  isLoadingCurve?: boolean;
  showDetail?: boolean;
  compact?: boolean;
  onToggleBuy: (isBuy: boolean) => void;
  onAmountChange: (amount: string) => void;
  onSwap: () => void;
};

const QUICK_BUY = ["0.1", "0.5", "1", "MAX"];
const QUICK_SELL = ["25%", "50%", "75%", "100%"];

function BondingCurveWidget({
  fillPercent,
  isLoading,
  quoteReserves,
}: {
  fillPercent: number;
  isLoading?: boolean;
  quoteReserves?: string;
}) {
  const pct = Math.max(0, Math.min(fillPercent, 100));
  const displayPct = pct > 0 ? Math.max(pct, 0.4) : 0;

  const GRADUATE_SOL = 85;
  const currentSol = quoteReserves ? Number(quoteReserves) / 1e9 : 0;
  const remaining = Math.max(0, GRADUATE_SOL - currentSol);

  const color = pct >= 80 ? "#14F195" : pct >= 50 ? "#9945FF" : "#6366f1";
  const glowColor =
    pct >= 80
      ? "rgba(20,241,149,0.5)"
      : pct >= 50
      ? "rgba(153,69,255,0.4)"
      : "rgba(99,102,241,0.3)";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(153,69,255,0.12)",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#14F195",
              boxShadow: "0 0 6px #14F195",
              animation: "bcPulse 1.8s ease-in-out infinite",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              fontWeight: 600,
            }}
          >
            BONDING CURVE PROGRESS
          </span>
        </div>
        {pct >= 80 && (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: 800,
              color: "#14F195",
              letterSpacing: "0.08em",
              background: "rgba(20,241,149,0.1)",
              border: "1px solid rgba(20,241,149,0.25)",
              borderRadius: 5,
              padding: "2px 7px",
              animation: "bcPulse 1.4s ease-in-out infinite",
            }}
          >
            RAYDIUM SOON
          </span>
        )}
      </div>

      {/* Big % number */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          fontFamily: "monospace",
          color: "#fff",
          lineHeight: 1,
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}
      >
        {isLoading ? (
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 24 }}>
            ...
          </span>
        ) : (
          <>
            <span
              style={{
                background: `linear-gradient(90deg, ${color}, #fff)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {pct.toFixed(2)}
            </span>
            <span
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.35)",
                WebkitTextFillColor: "rgba(255,255,255,0.35)",
                fontWeight: 700,
                marginLeft: 2,
              }}
            >
              %
            </span>
          </>
        )}
      </div>

      {/* Bar */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          marginBottom: 8,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
            animation: "bcShimmer 2.4s linear infinite",
          }}
        />
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            width: `${displayPct}%`,
            background: `linear-gradient(90deg, ${color}77, ${color})`,
            boxShadow: pct > 0 ? `0 0 10px ${glowColor}` : "none",
            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
            position: "relative",
          }}
        >
          {pct > 1 && (
            <div
              style={{
                position: "absolute",
                right: -1,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 8px ${glowColor}, 0 0 14px ${glowColor}`,
              }}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span
          style={{
            color: "rgba(255,255,255,0.25)",
            fontFamily: "monospace",
            fontSize: 10,
          }}
        >
          {currentSol > 0 ? `${currentSol.toFixed(3)} SOL` : "0.1 SOL"}
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.25)",
            fontFamily: "monospace",
            fontSize: 10,
          }}
        >
          {isLoading
            ? "..."
            : remaining > 0
            ? `$${(remaining * 73).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })} to graduate`
            : "Graduated"}
        </span>
      </div>

      <style>{`
        @keyframes bcPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bcShimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export default function TradePanel({
  token,
  isBuy,
  amount,
  isSwapping,
  swapError,
  curveInfo,
  isLoadingCurve,
  showDetail = true,
  compact = false,
  onToggleBuy,
  onAmountChange,
  onSwap,
}: TradePanelProps) {
  const { connected } = useWallet();

  const lifecycle = curveInfo?.lifecycle;
  const canTrade = lifecycle?.isSwappable !== false;
  const fillPercent = Math.max(0, Math.min(lifecycle?.fillPercent ?? 0, 100));
  const priceRaw = curveInfo?.price?.tokensPerSol
    ? Number(curveInfo.price.tokensPerSol)
    : null;
  const priceText =
    priceRaw && Number.isFinite(priceRaw)
      ? priceRaw.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : null;

  if (!token) {
    return (
      <div
        style={{
          background: "linear-gradient(160deg, #0d0d1a 0%, #12061f 100%)",
          border: "1px solid rgba(153,69,255,0.15)",
          borderRadius: 20,
          padding: 32,
          position: compact ? "relative" : "sticky",
          top: compact ? undefined : 96,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 280,
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(153,69,255,0.1)",
            border: "1px solid rgba(153,69,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
        >
          ⚡
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.3)",
            fontFamily: "monospace",
            fontSize: 13,
            letterSpacing: "0.08em",
          }}
        >
          SELECT_TOKEN_TO_TRADE
        </p>
      </div>
    );
  }

  const quickAmounts = isBuy ? QUICK_BUY : QUICK_SELL;

  return (
    <div
      style={{
        background: "linear-gradient(160deg, #0d0d1a 0%, #12061f 100%)",
        border: `1px solid ${
          isBuy ? "rgba(20,241,149,0.2)" : "rgba(255,45,149,0.2)"
        }`,
        borderRadius: 20,
        padding: 24,
        position: compact ? "relative" : "sticky",
        top: compact ? undefined : 96,
        boxShadow: isBuy
          ? "0 0 40px rgba(20,241,149,0.06), inset 0 1px 0 rgba(20,241,149,0.08)"
          : "0 0 40px rgba(255,45,149,0.06), inset 0 1px 0 rgba(255,45,149,0.08)",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* ── HEADER ── */}
      {showDetail && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            {token.imageUrl ? (
              <img
                src={token.imageUrl}
                alt={token.symbol}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(153,69,255,0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #9945FF, #14F195)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {token.symbol[0]}
              </div>
            )}
            <div>
              <p
                style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0 }}
              >
                {token.name}
              </p>
              <p
                style={{
                  color: "rgba(153,69,255,0.8)",
                  fontFamily: "monospace",
                  fontSize: 12,
                  margin: 0,
                }}
              >
                ${token.symbol}
              </p>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: canTrade ? "#14F195" : "#ff4444",
                  boxShadow: canTrade
                    ? "0 0 8px #14F195"
                    : "0 0 8px #ff4444",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                  fontSize: 10,
                }}
              >
                {canTrade ? "LIVE" : "PAUSED"}
              </span>
            </div>
          </div>

          {priceText && (
            <div
              style={{
                padding: "6px 10px",
                background: "rgba(153,69,255,0.06)",
                border: "1px solid rgba(153,69,255,0.12)",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                  fontSize: 10,
                }}
              >
                PRICE
              </span>
              <span
                style={{
                  color: "#14F195",
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {priceText} {token.symbol}/SOL
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── BONDING CURVE WIDGET ── */}
      <BondingCurveWidget
        fillPercent={fillPercent}
        isLoading={isLoadingCurve}
        quoteReserves={curveInfo?.reserves?.quoteReserves}
      />

      {/* ── BUY / SELL TOGGLE ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          padding: 4,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        {[true, false].map((buy) => (
          <button
            key={String(buy)}
            onClick={() => onToggleBuy(buy)}
            style={{
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              transition: "all 0.2s",
              background:
                isBuy === buy
                  ? buy
                    ? "linear-gradient(135deg, #14F195, #0fa96a)"
                    : "linear-gradient(135deg, #ff2d95, #c4006b)"
                  : "transparent",
              color: isBuy === buy ? "#fff" : "rgba(255,255,255,0.3)",
              boxShadow:
                isBuy === buy
                  ? buy
                    ? "0 0 20px rgba(20,241,149,0.3)"
                    : "0 0 20px rgba(255,45,149,0.3)"
                  : "none",
            }}
          >
            {buy ? "◆ BUY" : "◆ SELL"}
          </button>
        ))}
      </div>

      {/* ── AMOUNT INPUT ── */}
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            display: "block",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: "0.1em",
            marginBottom: 6,
          }}
        >
          {isBuy ? "AMOUNT_IN (SOL)" : "AMOUNT_IN (TOKENS)"}
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            style={{
              width: "100%",
              height: 52,
              paddingLeft: 16,
              paddingRight: 60,
              background: "#07070f",
              border: `1px solid ${
                amount
                  ? isBuy
                    ? "rgba(20,241,149,0.3)"
                    : "rgba(255,45,149,0.3)"
                  : "rgba(153,69,255,0.15)"
              }`,
              borderRadius: 12,
              color: "#fff",
              fontSize: 20,
              fontFamily: "monospace",
              fontWeight: 700,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: isBuy ? "#14F195" : "#ff2d95",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 700,
              pointerEvents: "none",
            }}
          >
            {isBuy ? "SOL" : token.symbol}
          </div>
        </div>
      </div>

      {/* ── QUICK AMOUNTS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 6,
          marginBottom: 18,
        }}
      >
        {quickAmounts.map((preset) => (
          <button
            key={preset}
            onClick={() => onAmountChange(preset.replace("%", ""))}
            style={{
              padding: "7px 0",
              background: "rgba(153,69,255,0.06)",
              border: "1px solid rgba(153,69,255,0.15)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
              letterSpacing: "0.04em",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = isBuy
                ? "rgba(20,241,149,0.4)"
                : "rgba(255,45,149,0.4)";
              (e.target as HTMLButtonElement).style.color = "#fff";
              (e.target as HTMLButtonElement).style.background = isBuy
                ? "rgba(20,241,149,0.08)"
                : "rgba(255,45,149,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor =
                "rgba(153,69,255,0.15)";
              (e.target as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.5)";
              (e.target as HTMLButtonElement).style.background =
                "rgba(153,69,255,0.06)";
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* ── EXECUTE BUTTON ── */}
      <button
        onClick={onSwap}
        disabled={isSwapping || !amount || !connected || !canTrade}
        style={{
          width: "100%",
          height: 54,
          borderRadius: 14,
          border: "none",
          cursor:
            isSwapping || !amount || !connected || !canTrade
              ? "not-allowed"
              : "pointer",
          opacity:
            isSwapping || !amount || !connected || !canTrade ? 0.4 : 1,
          background: isBuy
            ? "linear-gradient(135deg, #14F195 0%, #0fa96a 100%)"
            : "linear-gradient(135deg, #ff2d95 0%, #c4006b 100%)",
          boxShadow:
            isSwapping || !amount
              ? "none"
              : isBuy
              ? "0 0 30px rgba(20,241,149,0.4), 0 4px 20px rgba(20,241,149,0.2)"
              : "0 0 30px rgba(255,45,149,0.4), 0 4px 20px rgba(255,45,149,0.2)",
          color: "#fff",
          fontWeight: 900,
          fontSize: 15,
          letterSpacing: "0.12em",
          fontFamily: "monospace",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isSwapping ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                animation: "spin 0.8s linear infinite",
              }}
            >
              ◈
            </span>
            EXECUTING...
          </span>
        ) : !canTrade ? (
          "CURVE_INACTIVE"
        ) : (
          `${isBuy ? "▲ BUY" : "▼ SELL"} ${token.symbol}`
        )}
      </button>

      {swapError && (
        <p
          style={{
            color: "#ff4444",
            fontFamily: "monospace",
            fontSize: 11,
            textAlign: "center",
            marginTop: 10,
            letterSpacing: "0.04em",
          }}
        >
          ⚠ {swapError}
        </p>
      )}
      {!connected && (
        <p
          style={{
            color: "rgba(153,69,255,0.5)",
            fontFamily: "monospace",
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
            letterSpacing: "0.06em",
          }}
        >
          CONNECT_WALLET_TO_TRADE
        </p>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}