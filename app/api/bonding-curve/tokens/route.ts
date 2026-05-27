import { NextResponse } from "next/server";
import { getDexTokenRegistry } from "@/lib/dex/tokenRegistry";

export async function GET() {
  try {
    const { tokens, total } = await getDexTokenRegistry({ limit: 200 });

    return NextResponse.json({
      success: true,
      tokens,
      total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Bonding curve tokens error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
