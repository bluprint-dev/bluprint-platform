import { NextRequest, NextResponse } from "next/server";

const HELIUS_API_KEY = process.env.HELIUS_RPC_URL?.split("api-key=")[1] ?? "";
const HELIUS_API = `https://api.helius.xyz/v0`;

type OHLCCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function buildOHLC(trades: { time: number; price: number; volume: number }[], intervalMs: number): OHLCCandle[] {
  if (trades.length === 0) return [];

  const sorted = [...trades].sort((a, b) => a.time - b.time);
  const buckets = new Map<number, { prices: number[]; volume: number }>();

  for (const t of sorted) {
    const bucket = Math.floor(t.time / intervalMs) * intervalMs;
    if (!buckets.has(bucket)) buckets.set(bucket, { prices: [], volume: 0 });
    buckets.get(bucket)!.prices.push(t.price);
    buckets.get(bucket)!.volume += t.volume;
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, { prices, volume }]) => ({
      time: Math.floor(ts / 1000),
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume,
    }));
}

function parsePriceFromTx(tx: any, mint: string): { price: number; volume: number } | null {
  try {
    const events = tx?.events?.swap;
    if (events) {
      const tokenIn = events.tokenInputs?.find((t: any) => t.mint === mint);
      const tokenOut = events.tokenOutputs?.find((t: any) => t.mint === mint);
      const nativeIn = events.nativeInput;
      const nativeOut = events.nativeOutput;

      if (tokenOut && nativeIn) {
        const sol = nativeIn.amount / 1e9;
        const tokens = tokenOut.rawTokenAmount.tokenAmount / Math.pow(10, tokenOut.rawTokenAmount.decimals);
        if (tokens > 0) return { price: sol / tokens, volume: sol };
      }
      if (tokenIn && nativeOut) {
        const sol = nativeOut.amount / 1e9;
        const tokens = tokenIn.rawTokenAmount.tokenAmount / Math.pow(10, tokenIn.rawTokenAmount.decimals);
        if (tokens > 0) return { price: sol / tokens, volume: sol };
      }
    }

    // Fallback: tokenTransfers
    const transfers = tx?.tokenTransfers ?? [];
    const nativeTransfers = tx?.nativeTransfers ?? [];

    const tokenTransfer = transfers.find((t: any) => t.mint === mint);
    if (tokenTransfer && nativeTransfers.length > 0) {
      const solTransfer = nativeTransfers[0];
      const sol = Math.abs(solTransfer.amount) / 1e9;
      const tokens = tokenTransfer.tokenAmount;
      if (tokens > 0 && sol > 0) return { price: sol / tokens, volume: sol };
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");
  const interval = req.nextUrl.searchParams.get("interval") ?? "1"; // minutes

  if (!mint) return NextResponse.json({ error: "mint required" }, { status: 400 });
  if (!HELIUS_API_KEY) return NextResponse.json({ error: "no helius key" }, { status: 500 });

  try {
    // Fetch last 100 transactions
    const res = await fetch(
      `${HELIUS_API}/addresses/${mint}/transactions?api-key=${HELIUS_API_KEY}&limit=100&type=SWAP`,
      { next: { revalidate: 30 } }
    );

    if (!res.ok) throw new Error(`Helius error: ${res.status}`);
    const txs: any[] = await res.json();

    const trades: { time: number; price: number; volume: number }[] = [];

    for (const tx of txs) {
      const parsed = parsePriceFromTx(tx, mint);
      if (parsed && tx.timestamp) {
        trades.push({
          time: tx.timestamp * 1000,
          price: parsed.price,
          volume: parsed.volume,
        });
      }
    }

    const intervalMs = Number(interval) * 60 * 1000;
    const candles = buildOHLC(trades, intervalMs);

    return NextResponse.json({ success: true, candles, count: trades.length });
  } catch (err) {
    console.error("Chart API error:", err);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}