import type { StoredScore } from "../../domain/score";

export interface ScoreRepository {
  listByGame(gameId: string): Promise<StoredScore[]>;
}
