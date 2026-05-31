import type { DexToken } from "@/types/dex";

// ------------------------------
// NORMALIZE TOKEN
// ✅ genesisAccount artık her zaman korunuyor
// mint  → SPL token adresi (display, metadata, ATA)
// genesisAccount → Metaplex Genesis launch account (curve ops, PDA)
// ------------------------------
export function normalizeToken(
  raw: Partial<DexToken> & { mint: string }
): DexToken {
  return {
    mint: raw.mint,

    // ✅ genesisAccount yoksa undefined bırak — zorla mint ataması yapma
    // DexPageContent bu alanı kontrol ederek fallback yapıyor
    genesisAccount: raw.genesisAccount,

    name:      raw.name?.trim()   || "Unknown",
    symbol:    raw.symbol?.trim() || "???",

    imageUrl:
      raw.imageUrl ||
      (raw as { image?: string }).image ||
      "",

    creator:   raw.creator   || "",
    createdAt: raw.createdAt || Date.now(),
  };
}

// ------------------------------
// FILTER TOKENS
// mint veya genesisAccount ile de arama yapılabilir
// ------------------------------
export function filterTokens(
  tokens: DexToken[],
  query: string
): DexToken[] {
  const q = query.trim().toLowerCase();

  if (!q) return tokens;

  return tokens.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.mint.toLowerCase().includes(q) ||
      // ✅ genesisAccount ile de arama destekleniyor
      (t.genesisAccount?.toLowerCase().includes(q) ?? false)
  );
}

// ------------------------------
// SORT
// ------------------------------
export function sortTokensNewest(tokens: DexToken[]): DexToken[] {
  return [...tokens].sort(
    (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
  );
}

// ------------------------------
// SHORT ADDRESS HELPERS
// mint veya genesisAccount kısaltma için
// ------------------------------
export function shortMint(
  mint: string,
  start = 6,
  end = 4
): string {
  if (mint.length <= start + end) return mint;
  return `${mint.slice(0, start)}...${mint.slice(-end)}`;
}

// shortMint ile aynı — genesisAccount için semantic alias
export const shortAddress = shortMint;