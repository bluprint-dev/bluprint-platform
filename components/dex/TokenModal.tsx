"use client";

import type { DexToken } from "@/types/dex";
import type { BondingCurveInfo } from "@/hooks/useBondingCurveInfo";
import type { ReactNode } from "react";

type TokenModalProps = {
  token: DexToken | null;
  open: boolean;
  curveInfo?: BondingCurveInfo | null;
  isLoadingCurve?: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export default function TokenModal({
  token, open, onClose, children,
}: TokenModalProps) {
  if (!open || !token) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(7,7,15,0.85)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "linear-gradient(160deg, #0d0d1a 0%, #12061f 100%)",
        borderTop: "1px solid rgba(153,69,255,0.25)",
        borderRadius: "20px 20px 0 0",
        padding: 20,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 -20px 60px rgba(153,69,255,0.15)",
      }}>
        {/* scan line */}
        <div style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, #9945FF, #14F195, transparent)",
          marginBottom: 16, opacity: 0.6,
        }} />

        {/* drag handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "rgba(153,69,255,0.3)",
          margin: "-8px auto 16px",
        }} />

        {/* close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(153,69,255,0.08)",
          border: "1px solid rgba(153,69,255,0.2)",
          color: "rgba(153,69,255,0.7)",
          cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>

        {children}
      </div>
    </div>
  );
}