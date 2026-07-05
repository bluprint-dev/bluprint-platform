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
