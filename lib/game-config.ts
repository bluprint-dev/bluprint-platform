// Server-authoritative oyun sabitleri.
// Client bu değerleri /api/games/start yanıtından alır; skor doğrulaması
// submit anında bu sabitlere göre server'da yeniden yapılır.

export type GameId = "axor_runner" | "flappy_bird" | "block_blast";

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
    maxScorePerSecond: 12,
    minDurationMs: 1500,
    maxDurationMs: 15 * 60 * 1000,
    maxSubmitsPerMinute: 5,
  },
  flappy_bird: {
    id: "flappy_bird",
    // Skor = geçilen boru sayısı, saniyede genelde <1 artar. Tahmini değer,
    // gerçek boru aralığına göre kalibre edilmeli.
    maxScorePerSecond: 2,
    minDurationMs: 800,
    maxDurationMs: 15 * 60 * 1000,
    maxSubmitsPerMinute: 5,
  },
  block_blast: {
    id: "block_blast",
    // Tek hamlede çoklu satır temizlenince büyük puan sıçraması olabilir,
    // bu yüzden tavan yüksek tutuldu. Gerçek puanlama tablosuna göre
    // kalibre edilmeli.
    maxScorePerSecond: 800,
    minDurationMs: 1000,
    maxDurationMs: 20 * 60 * 1000,
    maxSubmitsPerMinute: 5,
  },
};

export function getGameConfig(gameId: string): GameConfig | null {
  return GAME_CONFIGS[gameId as GameId] ?? null;
}

export function generateSessionSeed(): string {
  return crypto.randomUUID();
}