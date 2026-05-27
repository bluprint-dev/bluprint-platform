"use client";

type LoadingSkeletonProps = {
  count?: number;
};

export default function LoadingSkeleton({ count = 8 }: LoadingSkeletonProps) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse"
        >
          <div className="w-11 h-11 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-3 w-40 rounded bg-white/5" />
          </div>
          <div className="h-4 w-4 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
