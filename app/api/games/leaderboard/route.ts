import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId") ?? "axor_runner";
  const day = searchParams.get("day") ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_leaderboard")
    .select("wallet, best_score, reward_amount, tx_signature, paid_at")
    .eq("game_id", gameId)
    .eq("day", day)
    .order("best_score", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, day, gameId, leaderboard: data });
}
