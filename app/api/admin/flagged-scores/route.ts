import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminToken } from "@/lib/security/admin-token";

export async function GET(req: NextRequest) {
  const auth = verifyAdminToken(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("flagged_scores")
    .select(
      `id, reason, admin_decision, created_at,
       game_sessions ( id, wallet, game_id, score, duration_ms, created_at )`
    )
    .is("admin_decision", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, flagged: data });
}

export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const flaggedId: string | undefined = body?.flaggedId;
  const decision: "approved" | "rejected" | undefined = body?.decision;

  if (!flaggedId || !decision) {
    return NextResponse.json(
      { success: false, error: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  const { data: flagged, error: flagErr } = await supabase
    .from("flagged_scores")
    .select("id, session_id")
    .eq("id", flaggedId)
    .single();

  if (flagErr || !flagged) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  await supabase
    .from("flagged_scores")
    .update({
      admin_decision: decision,
      decided_at: new Date().toISOString(),
      decided_by: auth.publicKey,
    })
    .eq("id", flaggedId);

  if (decision === "approved") {
    const { data: session } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", flagged.session_id)
      .single();

    if (session) {
      await supabase
        .from("game_sessions")
        .update({ status: "verified" })
        .eq("id", session.id);

      const day = new Date(session.created_at).toISOString().slice(0, 10);

      const { data: existing } = await supabase
        .from("daily_leaderboard")
        .select("id, best_score")
        .eq("day", day)
        .eq("wallet", session.wallet)
        .eq("game_id", session.game_id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("daily_leaderboard").insert({
          day,
          wallet: session.wallet,
          game_id: session.game_id,
          best_score: session.score,
          session_id: session.id,
        });
      } else if (session.score > existing.best_score) {
        await supabase
          .from("daily_leaderboard")
          .update({ best_score: session.score, session_id: session.id })
          .eq("id", existing.id);
      }
    }
  } else {
    await supabase
      .from("game_sessions")
      .update({ status: "rejected", reject_reason: "admin_rejected" })
      .eq("id", flagged.session_id);
  }

  return NextResponse.json({ success: true });
}
