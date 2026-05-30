import type { DexToken } from "@/types/dex";

export function normalizeToken(
  raw: Partial<DexToken> & {
    mint: string;
  }
): DexToken {
  return {
    mint: raw.mint,

    genesisAccount:
      raw.genesisAccount,

    name:
      raw.name?.trim() ||
      "Unknown",

    symbol:
      raw.symbol?.trim() ||
      "???",

    imageUrl:
      raw.imageUrl ||
      (raw as { image?: string }).image ||
      "",

    creator:
      raw.creator || "",

    createdAt:
      raw.createdAt ||
      Date.now(),
  };
}

export function filterTokens(
  tokens: DexToken[],
  query: string
): DexToken[] {
  const q =
    query.trim().toLowerCase();

  if (!q) {
    return tokens;
  }

  return tokens.filter(
    (t) =>
      t.name
        .toLowerCase()
        .includes(q) ||
      t.symbol
        .toLowerCase()
        .includes(q) ||
      t.mint
        .toLowerCase()
        .includes(q)
  );
}

export function sortTokensNewest(
  tokens: DexToken[]
): DexToken[] {
  return [...tokens].sort(
    (a, b) =>
      (b.createdAt ?? 0) -
      (a.createdAt ?? 0)
  );
}

export function shortMint(
  mint: string,
  start = 6,
  end = 4
): string {
  if (
    mint.length <=
    start + end
  ) {
    return mint;
  }

  return `${mint.slice(
    0,
    start
  )}...${mint.slice(-end)}`;
}