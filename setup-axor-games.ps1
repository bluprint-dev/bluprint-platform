# Axor Oyun/Ödül Sistemi - Otomatik Kurulum Script'i
# Çalıştırmadan önce: D:\BLUEPRINT\meme-coin-creator klasöründe olduğundan emin ol
# Kullanım: powershell -ExecutionPolicy Bypass -File .\setup-axor-games.ps1

$root = "D:\BLUEPRINT\meme-coin-creator"

$dirs = @(
    "$root\app\lib\security",
    "$root\app\api\games\start",
    "$root\app\api\games\submit",
    "$root\app\api\games\leaderboard",
    "$root\app\api\games\pool",
    "$root\app\api\admin\flagged-scores",
    "$root\supabase\migrations"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

# ---------- app/lib/game-config.ts ----------
@'
// Server-authoritative oyun sabitleri.
// Client bu değerleri /api/games/start yanıtından alır; skor doğrulaması
// submit anında bu sabitlere göre server'da yeniden yapılır.

export type GameId = "axor_runner";

export interface GameConfig {
  id: GameId;
  maxScorePerSecond: number;   // puan/saniye üst limiti - aşılırsa reject
  minDurationMs: number;       // bundan kısa oturumlar şüpheli
  maxDurationMs: number;       // güvenlik tavanı
  maxSubmitsPerMinute: number; // rate limit
}

export const GAME_CONFIGS: Record<GameId, GameConfig> = {
  axor_runner: {
    id: "axor_runner",
    // Gerçek oyun mantığına göre kalibre edilmeli, şimdilik tahmini değer.
    maxScorePerSecond: 12,
    minDurationMs: 1500,
    maxDurationMs: 15 * 60 * 1000,
    maxSubmitsPerMinute: 5,
  },
};

export function getGameConfig(gameId: string): GameConfig | null {
  return GAME_CONFIGS[gameId as GameId] ?? null;
}

export function generateSessionSeed(): string {
  return crypto.randomUUID();
}
'@ | Set-Content -Encoding UTF8 "$root\app\lib\game-config.ts"

# ---------- app/lib/anti-cheat.ts ----------
@'
import { supabase } from "@/lib/supabase";
import { GameConfig } from "./game-config";

export type CheckResult =
  | { verdict: "reject"; reason: string }
  | { verdict: "flag"; reason: string }
  | { verdict: "ok" };

export function checkScoreRatio(
  score: number,
  durationMs: number,
  config: GameConfig
): CheckResult {
  if (durationMs < config.minDurationMs) {
    return { verdict: "reject", reason: "duration_too_short" };
  }
  if (durationMs > config.maxDurationMs) {
    return { verdict: "reject", reason: "duration_too_long" };
  }

  const scorePerSecond = score / (durationMs / 1000);
  if (scorePerSecond > config.maxScorePerSecond) {
    return { verdict: "reject", reason: "ratio_exceeded" };
  }

  return { verdict: "ok" };
}

export async function checkRateLimit(
  wallet: string,
  maxPerMinute: number
): Promise<CheckResult> {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();

  const { count, error } = await supabase
    .from("submit_rate_log")
    .select("id", { count: "exact", head: true })
    .eq("wallet", wallet)
    .gte("submitted_at", oneMinuteAgo);

  if (error) {
    return { verdict: "flag", reason: "rate_limit_check_failed" };
  }
  if ((count ?? 0) >= maxPerMinute) {
    return { verdict: "reject", reason: "rate_limit" };
  }
  return { verdict: "ok" };
}

export async function checkStatisticalOutlier(
  gameId: string,
  score: number,
  day: string
): Promise<CheckResult> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("score")
    .eq("game_id", gameId)
    .eq("status", "verified")
    .gte("created_at", `${day}T00:00:00Z`)
    .lt("created_at", `${day}T23:59:59Z`);

  if (error || !data || data.length < 5) {
    return { verdict: "ok" };
  }

  const scores = data.map((r) => r.score as number).filter((s) => s != null);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  const OUTLIER_MULTIPLIER = 2.5;
  if (avg > 0 && score > avg * OUTLIER_MULTIPLIER) {
    return { verdict: "flag", reason: "statistical_outlier" };
  }
  return { verdict: "ok" };
}

export async function runAntiCheatPipeline(params: {
  wallet: string;
  gameId: string;
  score: number;
  durationMs: number;
  config: GameConfig;
  day: string;
}): Promise<CheckResult> {
  const { wallet, gameId, score, durationMs, config, day } = params;

  const ratioCheck = checkScoreRatio(score, durationMs, config);
  if (ratioCheck.verdict === "reject") return ratioCheck;

  const rateCheck = await checkRateLimit(wallet, config.maxSubmitsPerMinute);
  if (rateCheck.verdict === "reject") return rateCheck;

  const outlierCheck = await checkStatisticalOutlier(gameId, score, day);

  if (rateCheck.verdict === "flag") return rateCheck;
  if (outlierCheck.verdict === "flag") return outlierCheck;

  return { verdict: "ok" };
}
'@ | Set-Content -Encoding UTF8 "$root\app\lib\anti-cheat.ts"

# ---------- app/lib/security/admin-token.ts ----------
@'
// admin/verify/route.ts içindeki ADMIN_WALLETS ile AYNI listeyi burada da
// tutuyoruz (o dosyayı bozmamak için import etmek yerine kopyaladık).
// İleride tek bir yerden yönetmek istersen ikisini ortak bir dosyaya taşı.
const ADMIN_WALLETS = [
  "aJCqEsDgSXhkLUYAnq4tA2T3LfG7rMbfcdJapf9af9x", // YOUR_WALLET
  "2WyCLgg2vuvzmExak8WAeF9kBfvfcD4ahcKfm9P18gSc", // KUZEN_WALLET
];

interface AdminTokenPayload {
  publicKey: string;
  exp: number;
}

export function verifyAdminToken(authHeader: string | null): {
  ok: boolean;
  publicKey?: string;
  error?: string;
} {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, error: "missing_token" };
  }

  const token = authHeader.slice("Bearer ".length);

  let payload: AdminTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return { ok: false, error: "invalid_token" };
  }

  if (!payload.publicKey || !payload.exp) {
    return { ok: false, error: "invalid_token" };
  }

  if (Date.now() > payload.exp) {
    return { ok: false, error: "token_expired" };
  }

  if (!ADMIN_WALLETS.includes(payload.publicKey)) {
    return { ok: false, error: "not_admin" };
  }

  return { ok: true, publicKey: payload.publicKey };
}
'@ | Set-Content -Encoding UTF8 "$root\app\lib\security\admin-token.ts"

# ---------- app/api/games/start/route.ts ----------
@'
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
'@ | Set-Content -Encoding UTF8 "$root\app\api\games\start\route.ts"

# ---------- app/api/games/submit/route.ts ----------
@'
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
'@ | Set-Content -Encoding UTF8 "$root\app\api\games\submit\route.ts"

# ---------- app/api/games/leaderboard/route.ts ----------
@'
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
'@ | Set-Content -Encoding UTF8 "$root\app\api\games\leaderboard\route.ts"

# ---------- app/api/games/pool/route.ts ----------
@'
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
'@ | Set-Content -Encoding UTF8 "$root\app\api\games\pool\route.ts"

# ---------- app/api/admin/flagged-scores/route.ts ----------
@'
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
'@ | Set-Content -Encoding UTF8 "$root\app\api\admin\flagged-scores\route.ts"

# ---------- supabase/migrations/0001_game_rewards.sql ----------
@'
-- ============================================================
-- AXOR Oyun / Ödül Sistemi - Supabase Şeması
-- RLS kapalı birakildi (trades tablosuyla tutarlı - anon key kullanılıyor)
-- ============================================================

create table if not exists games (
  id text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into games (id, name) values ('axor_runner', 'Axor Runner')
on conflict (id) do nothing;

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token uuid not null unique default gen_random_uuid(),
  wallet text not null,
  game_id text not null references games(id),

  server_seed text not null,
  speed_multiplier numeric not null default 1.0,

  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms bigint,

  score bigint,

  status text not null default 'pending'
    check (status in ('pending', 'verified', 'flagged', 'rejected')),
  reject_reason text,

  created_at timestamptz not null default now()
);

create index if not exists idx_game_sessions_wallet on game_sessions(wallet);
create index if not exists idx_game_sessions_status on game_sessions(status);
create index if not exists idx_game_sessions_token on game_sessions(session_token);

create table if not exists daily_leaderboard (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  wallet text not null,
  game_id text not null references games(id),
  best_score bigint not null,
  session_id uuid references game_sessions(id),

  reward_amount numeric,
  tx_signature text,
  paid_at timestamptz,

  created_at timestamptz not null default now(),
  unique (day, wallet, game_id)
);

create index if not exists idx_daily_leaderboard_day on daily_leaderboard(day, game_id);

create table if not exists reward_pools (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  game_id text not null references games(id),
  total_amount numeric not null default 0,
  is_distributed boolean not null default false,
  distributed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (day, game_id)
);

create table if not exists flagged_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id),
  reason text not null,
  admin_decision text
    check (admin_decision in ('approved', 'rejected')),
  decided_at timestamptz,
  decided_by text,
  created_at timestamptz not null default now()
);

create table if not exists submit_rate_log (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_submit_rate_log_wallet_time on submit_rate_log(wallet, submitted_at);
'@ | Set-Content -Encoding UTF8 "$root\supabase\migrations\0001_game_rewards.sql"

Write-Host ""
Write-Host "===================================================="
Write-Host "TAMAMLANDI. Olusturulan dosyalar:"
Write-Host "===================================================="
Write-Host "$root\app\lib\game-config.ts"
Write-Host "$root\app\lib\anti-cheat.ts"
Write-Host "$root\app\lib\security\admin-token.ts"
Write-Host "$root\app\api\games\start\route.ts"
Write-Host "$root\app\api\games\submit\route.ts"
Write-Host "$root\app\api\games\leaderboard\route.ts"
Write-Host "$root\app\api\games\pool\route.ts"
Write-Host "$root\app\api\admin\flagged-scores\route.ts"
Write-Host "$root\supabase\migrations\0001_game_rewards.sql"
Write-Host ""
Write-Host "SIRADAKI ADIM: 0001_game_rewards.sql icerigini Supabase Dashboard > SQL Editor'e yapistir ve calistir."
