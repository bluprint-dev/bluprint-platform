"use client";

import { Suspense } from "react";
import DexPageContent from "@/components/dex/DexPageContent";
import LoadingSkeleton from "@/components/dex/LoadingSkeleton";

export default function DexPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSkeleton />
        </div>
      }
    >
      <DexPageContent />
    </Suspense>
  );
}
