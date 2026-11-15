import type { ScoreRepository } from "../application/ports/score-repository";
import type { StoredScore } from "../domain/score";

export class InMemoryScoreRepository implements ScoreRepository {
  constructor(private readonly byGame: Record<string, StoredScore[]> = {}) {}

  async listByGame(gameId: string): Promise<StoredScore[]> {
    return [...(Object.hasOwn(this.byGame, gameId) ? this.byGame[gameId] : [])];
  }
}
