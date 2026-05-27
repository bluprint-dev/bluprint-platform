import { redis } from "@/app/lib/redis";
import { normalizeToken } from "@/lib/dex/normalizeToken";
import type { DexToken } from "@/types/dex";

const METADATA_TTL = 3600;

async function fetchExternalMetadata(mint: string): Promise<Partial<DexToken> | null> {
  try {
    const res = await fetch(`https://public-api.solscan.io/token/meta?token=${mint}`, {
      headers: { Accept: "application/json", "User-Agent": "BluPrint/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      name: data.name,
      symbol: data.symbol,
      imageUrl: data.icon || "",
      creator: data.creator || "",
      createdAt: data.createdAt || Date.now(),
    };
  } catch {
    return null;
  }
}

async function resolveTokenMetadata(mint: string): Promise<DexToken> {
  try {
    const metadataRaw = await redis.get(`token:metadata:${mint}`);

    if (metadataRaw && typeof metadataRaw === "string") {
      const parsed = JSON.parse(metadataRaw);
      return normalizeToken({ mint, ...parsed });
    }

    const external = await fetchExternalMetadata(mint);
    if (external) {
      const token = normalizeToken({ mint, ...external });
      await redis.set(`token:metadata:${mint}`, JSON.stringify(token), { ex: METADATA_TTL });
      return token;
    }
  } catch (err) {
    console.error(`Metadata resolve failed for ${mint}:`, err);
  }

  return normalizeToken({ mint });
}

export async function getAllTokenMints(): Promise<string[]> {
  const tokenMints = await redis.smembers("bonding-curve:tokens");
  const list = Array.isArray(tokenMints) ? tokenMints.filter((m): m is string => typeof m === "string") : [];
  return [...new Set(list)];
}

export async function getDexTokenRegistry(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ tokens: DexToken[]; total: number }> {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const allMints = await getAllTokenMints();
  const paginated = allMints.slice(offset, offset + limit);

  const results = await Promise.all(paginated.map((mint) => resolveTokenMetadata(mint)));

  return {
    tokens: results.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    total: allMints.length,
  };
}
