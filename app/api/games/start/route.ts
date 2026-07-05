import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getGameConfig, generateSessionSeed } from "@/lib/game-config";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const wallet: string | undefined = body?.wallet;
  const gameId: string | undefined = body?.gameId;

  if (!wallet || !gameId) {
    return NextResponse.json(
      { success: false, error: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  const config = getGameConfig(gameId);
  if (!config) {
    return NextResponse.json(
      { success: false, error: "INVALID_GAME" },
      { status: 400 }
    );
  }

  const serverSeed = generateSessionSeed();

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      wallet,
      game_id: gameId,
      server_seed: serverSeed,
      speed_multiplier: 1.0,
      status: "pending",
    })
    .select("id, session_token, started_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "SESSION_CREATE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    sessionToken: data.session_token,
    startedAt: data.started_at,
    gameConfig: { speedMultiplier: 1.0, seed: serverSeed },
  });
}
