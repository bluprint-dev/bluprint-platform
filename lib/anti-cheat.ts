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

const HEARTBEAT_INTERVAL_MS = 2000;
const HEARTBEAT_MIN_DURATION_MS = 4000; // sessions shorter than this get a pass
const HEARTBEAT_TOLERANCE = 0.4; // must have at least 40% of expected heartbeats

export function checkHeartbeat(durationMs: number, heartbeatCount: number): CheckResult {
  if (durationMs < HEARTBEAT_MIN_DURATION_MS) {
    return { verdict: "ok" };
  }
  const expected = durationMs / HEARTBEAT_INTERVAL_MS;
  const minRequired = Math.floor(expected * HEARTBEAT_TOLERANCE);
  if (heartbeatCount < minRequired) {
    return { verdict: "reject", reason: "no_heartbeat_activity" };
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
  heartbeatCount: number;
  config: GameConfig;
  day: string;
}): Promise<CheckResult> {
  const { wallet, gameId, score, durationMs, heartbeatCount, config, day } = params;

  const ratioCheck = checkScoreRatio(score, durationMs, config);
  if (ratioCheck.verdict === "reject") return ratioCheck;

  const heartbeatCheck = checkHeartbeat(durationMs, heartbeatCount);
  if (heartbeatCheck.verdict === "reject") return heartbeatCheck;

  const rateCheck = await checkRateLimit(wallet, config.maxSubmitsPerMinute);
  if (rateCheck.verdict === "reject") return rateCheck;

  const outlierCheck = await checkStatisticalOutlier(gameId, score, day);

  if (rateCheck.verdict === "flag") return rateCheck;
  if (outlierCheck.verdict === "flag") return outlierCheck;

  return { verdict: "ok" };
}