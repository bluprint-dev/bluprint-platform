import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionToken: string | undefined = body?.sessionToken;

  if (!sessionToken) {
    return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const { data: session, error: fetchErr } = await supabase
    .from("game_sessions")
    .select("id, status, heartbeat_count")
    .eq("session_token", sessionToken)
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ success: false, error: "SESSION_NOT_FOUND" }, { status: 404 });
  }

  if (session.status !== "pending") {
    return NextResponse.json({ success: true, ignored: true });
  }

  const { error: updateErr } = await supabase
    .from("game_sessions")
    .update({
      heartbeat_count: (session.heartbeat_count ?? 0) + 1,
      last_heartbeat_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}