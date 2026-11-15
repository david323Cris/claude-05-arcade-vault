import type { GameCatalog } from "../application/ports/game-catalog";

export class InMemoryGameCatalog implements GameCatalog {
  constructor(private readonly ids: string[] = []) {}

  async exists(gameId: string): Promise<boolean> {
    return this.ids.includes(gameId);
  }
}
