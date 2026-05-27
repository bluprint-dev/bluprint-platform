"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-red-500/20 bg-red-500/5">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">Failed to load tokens</h3>
      <p className="text-gray-400 text-sm text-center max-w-md mb-6">
        {message || "Something went wrong while fetching the market. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:border-[#ff2d95]/40 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
