import { NextRequest, NextResponse } from "next/server";
import { getDexTokenRegistry } from "@/lib/dex/tokenRegistry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { tokens, total } = await getDexTokenRegistry({ limit, offset });

    return NextResponse.json({
      success: true,
      tokens,
      total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Tokens error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
