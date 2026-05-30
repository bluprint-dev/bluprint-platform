import { NextResponse } from "next/server";
import { getDexTokenRegistry } from "@/lib/dex/tokenRegistry";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { tokens, total } = await getDexTokenRegistry({
      limit: 200,
    });

    return NextResponse.json({
      success: true,
      tokens: tokens ?? [],
      total: total ?? 0,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("TOKENS_ENDPOINT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        tokens: [],
        total: 0,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}