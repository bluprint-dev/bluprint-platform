import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get("mint");
  const type = searchParams.get("type") ?? "5m";

  if (!mint) {
    return NextResponse.json({ error: "mint required" }, { status: 400 });
  }

  const url = `https://public-api.birdeye.so/defi/ohlcv?address=${mint}&type=${type}&limit=100`;

  const res = await fetch(url, {
    headers: {
      "X-API-KEY": process.env.BIRDEYE_API_KEY ?? "",
      "x-chain": "solana",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Birdeye fetch failed", status: res.status }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}