import type { ScoreRepository } from "../application/ports/score-repository";
import type { StoredScore } from "../domain/score";

export class InMemoryScoreRepository implements ScoreRepository {
  private readonly byGame: Record<string, StoredScore[]>;

  constructor(byGame: Record<string, StoredScore[]> = {}) {
    this.byGame = structuredClone(byGame);
  }

  async listByGame(gameId: string): Promise<StoredScore[]> {
    return [...(Object.hasOwn(this.byGame, gameId) ? this.byGame[gameId] : [])];
  }

  async add(gameId: string, score: StoredScore): Promise<void> {
    if (!Object.hasOwn(this.byGame, gameId)) this.byGame[gameId] = [];
    this.byGame[gameId].push(score);
  }
}
