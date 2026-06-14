import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");

  if (!mint) {
    return NextResponse.json(
      { success: false, error: "MISSING_MINT" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("mint", mint)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, trades: data ?? [] });
}