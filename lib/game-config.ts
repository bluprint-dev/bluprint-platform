// Server-authoritative oyun sabitleri.
// Client bu deÄŸerleri /api/games/start yanÄ±tÄ±ndan alÄ±r; skor doÄŸrulamasÄ±
// submit anÄ±nda bu sabitlere gÃ¶re server'da yeniden yapÄ±lÄ±r.

export type GameId = "axor_runner";

export interface GameConfig {
  id: GameId;
  maxScorePerSecond: number;   // puan/saniye Ã¼st limiti - aÅŸÄ±lÄ±rsa reject
  minDurationMs: number;       // bundan kÄ±sa oturumlar ÅŸÃ¼pheli
  maxDurationMs: number;       // gÃ¼venlik tavanÄ±
  maxSubmitsPerMinute: number; // rate limit
}

export const GAME_CONFIGS: Record<GameId, GameConfig> = {
  axor_runner: {
    id: "axor_runner",
    // GerÃ§ek oyun mantÄ±ÄŸÄ±na gÃ¶re kalibre edilmeli, ÅŸimdilik tahmini deÄŸer.
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
