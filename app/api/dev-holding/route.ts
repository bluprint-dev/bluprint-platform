import { NextRequest, NextResponse } from "next/server";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ??
  "https://mainnet.helius-rpc.com/?api-key=fdbb8762-06b5-4bbd-ab1e-33310587e2d4";

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");
  const creator = req.nextUrl.searchParams.get("creator");

  if (!mint || !creator) {
    return NextResponse.json(
      { success: false, error: "MISSING_PARAMS" },
      { status: 400 }
    );
  }

  try {
    // 1) Token'ın toplam supply'ını al
    const supplyRes = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "supply",
        method: "getTokenSupply",
        params: [mint],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const supplyData = await supplyRes.json();
    const totalSupply = Number(supplyData?.result?.value?.amount ?? 0);

    if (!totalSupply) {
      return NextResponse.json({ success: true, devPercent: 0, devBalance: 0 });
    }

    // 2) Creator'ın associated token account'larını bul (owner bazlı)
    const ataRes = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "ata",
        method: "getTokenAccountsByOwner",
        params: [
          creator,
          { mint },
          { encoding: "jsonParsed" },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const ataData = await ataRes.json();
    const accounts = ataData?.result?.value ?? [];

    const devBalance = accounts.reduce((sum: number, acc: any) => {
      const amount = Number(
        acc?.account?.data?.parsed?.info?.tokenAmount?.amount ?? 0
      );
      return sum + amount;
    }, 0);

    const devPercent = (devBalance / totalSupply) * 100;

    return NextResponse.json({
      success: true,
      devBalance,
      totalSupply,
      devPercent: Number(devPercent.toFixed(2)),
    });
  } catch (error) {
    console.error("DEV_HOLDING_FETCH_FAILED", { mint, creator, error });
    return NextResponse.json(
      { success: false, error: "FETCH_FAILED" },
      { status: 500 }
    );
  }
}