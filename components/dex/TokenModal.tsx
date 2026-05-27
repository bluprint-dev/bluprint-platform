"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { DexToken } from "@/types/dex";
import TokenDetailPanel from "./TokenDetailPanel";
import type { BondingCurveInfo } from "@/hooks/useBondingCurveInfo";

type TokenModalProps = {
  token: DexToken | null;
  open: boolean;
  curveInfo?: BondingCurveInfo | null;
  isLoadingCurve?: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function TokenModal({
  token,
  open,
  curveInfo,
  isLoadingCurve,
  onClose,
  children,
}: TokenModalProps) {
  return (
    <AnimatePresence>
      {open && token && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 lg:hidden rounded-t-3xl border border-white/10 bg-[#12121A] p-5 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Trade {token.symbol}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <TokenDetailPanel token={token} curveInfo={curveInfo} isLoadingCurve={isLoadingCurve} />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
