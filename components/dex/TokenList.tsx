"use client";

import type { DexToken } from "@/types/dex";
import TokenCard from "./TokenCard";

type TokenListProps = {
  tokens: DexToken[];
  selectedToken: DexToken | null;
  onSelect: (token: DexToken) => void;
};

export default function TokenList({
  tokens,
  selectedToken,
  onSelect,
}: TokenListProps) {
  return (
    <div className="grid gap-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
      {tokens.map((token, index) => (
        <TokenCard
          key={token.mint}
          token={token}
          index={index}
          selected={
            selectedToken?.mint === token.mint
          }
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}