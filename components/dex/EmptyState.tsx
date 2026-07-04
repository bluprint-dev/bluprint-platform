"use client";

import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

type EmptyStateProps = {
  hasSearch?: boolean;
};

export default function EmptyState({ hasSearch }: EmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-white/5 bg-white/[0.02]">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff2d95]/20 to-[#ff6bcb]/20 flex items-center justify-center mb-4">
        <Rocket className="w-8 h-8 text-[#ff2d95]" />
      </div>
      <h3 className="text-white font-bold text-xl mb-2">
        {hasSearch ? "No tokens match your search" : "No tokens launched yet"}
      </h3>
      <p className="text-gray-400 text-sm text-center max-w-md mb-6">
        {hasSearch
          ? "Try a different name, symbol, or mint address."
          : "Be the first to launch a meme coin on Axor and start trading instantly."}
      </p>
      {!hasSearch && (
        <button
          onClick={() => router.push("/create")}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#ff6bcb] text-white font-bold hover:shadow-lg hover:shadow-[#ff2d95]/20 transition"
        >
          Launch Token
        </button>
      )}
    </div>
  );
}
