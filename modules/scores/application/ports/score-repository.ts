import type { StoredScore } from "../../domain/score";

export interface ScoreRepository {
  listByGame(gameId: string): Promise<StoredScore[]>;
  add(gameId: string, score: StoredScore): Promise<void>;
}
