import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getGameConfig } from "@/lib/game-config";
import { runAntiCheatPipeline } from "@/lib/anti-cheat";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionToken: string | undefined = body?.sessionToken;
  const wallet: string | undefined = body?.wallet;
  const score: number | undefined = body?.score;

  if (!sessionToken || !wallet || score == null) {
    return NextResponse.json(
      { success: false, error: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  const { data: session, error: sessionErr } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("session_token", sessionToken)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json(
      { success: false, error: "SESSION_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (session.status !== "pending") {
    return NextResponse.json(
      { success: false, error: "ALREADY_SUBMITTED" },
      { status: 409 }
    );
  }

  if (session.wallet !== wallet) {
    return NextResponse.json(
      { success: false, error: "WALLET_MISMATCH" },
      { status: 403 }
    );
  }

  await supabase.from("submit_rate_log").insert({ wallet });

  const startedAtMs = new Date(session.started_at).getTime();
  const durationMs = Date.now() - startedAtMs;

  const config = getGameConfig(session.game_id);
  if (!config) {
    return NextResponse.json(
      { success: false, error: "INVALID_GAME" },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const result = await runAntiCheatPipeline({
    wallet,
    gameId: session.game_id,
    score,
    durationMs,
    config,
    day: today,
  });

  const baseUpdate = {
    ended_at: new Date().toISOString(),
    duration_ms: durationMs,
    score,
  };

  if (result.verdict === "reject") {
    await supabase
      .from("game_sessions")
      .update({ ...baseUpdate, status: "rejected", reject_reason: result.reason })
      .eq("id", session.id);

    return NextResponse.json(
      { success: false, status: "rejected", reason: result.reason },
      { status: 400 }
    );
  }

  if (result.verdict === "flag") {
    await supabase
      .from("game_sessions")
      .update({ ...baseUpdate, status: "flagged", reject_reason: result.reason })
      .eq("id", session.id);

    await supabase.from("flagged_scores").insert({
      session_id: session.id,
      reason: result.reason,
    });

    return NextResponse.json({ success: true, status: "flagged", reason: result.reason });
  }

  await supabase
    .from("game_sessions")
    .update({ ...baseUpdate, status: "verified" })
    .eq("id", session.id);

  await upsertLeaderboard({
    day: today,
    wallet,
    gameId: session.game_id,
    score,
    sessionId: session.id,
  });

  return NextResponse.json({ success: true, status: "verified", score, durationMs });
}

async function upsertLeaderboard(params: {
  day: string;
  wallet: string;
  gameId: string;
  score: number;
  sessionId: string;
}) {
  const { day, wallet, gameId, score, sessionId } = params;

  const { data: existing } = await supabase
    .from("daily_leaderboard")
    .select("id, best_score")
    .eq("day", day)
    .eq("wallet", wallet)
    .eq("game_id", gameId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("daily_leaderboard").insert({
      day,
      wallet,
      game_id: gameId,
      best_score: score,
      session_id: sessionId,
    });
    return;
  }

  if (score > existing.best_score) {
    await supabase
      .from("daily_leaderboard")
      .update({ best_score: score, session_id: sessionId })
      .eq("id", existing.id);
  }
}
