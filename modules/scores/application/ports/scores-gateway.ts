import type { ScoreEntry, YourBest } from "../../domain/score";

/** Puerto de cliente: cómo el frontend lee y envía puntuaciones. */
export interface ScoresGateway {
  list(
    gameId: string,
    limit?: number,
  ): Promise<{ entries: ScoreEntry[]; you: YourBest | null }>;
  submit(gameId: string, input: { name: string; score: number }): Promise<ScoreEntry>;
}
