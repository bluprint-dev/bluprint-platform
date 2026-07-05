import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminToken } from "@/lib/security/admin-token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId") ?? "axor_runner";
  const day = searchParams.get("day") ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("reward_pools")
    .select("*")
    .eq("game_id", gameId)
    .eq("day", day)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    day,
    gameId,
    pool: data ?? { total_amount: 0, is_distributed: false },
  });
}

export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const gameId: string | undefined = body?.gameId;
  const day: string | undefined = body?.day;
  const totalAmount: number | undefined = body?.totalAmount;

  if (!gameId || !day || totalAmount == null) {
    return NextResponse.json(
      { success: false, error: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("reward_pools").upsert(
    { game_id: gameId, day, total_amount: totalAmount },
    { onConflict: "day,game_id" }
  );

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
