import type { GameRepository } from "../application/ports/game-repository";
import type { Game } from "../domain/game";

export class InMemoryGameRepository implements GameRepository {
  constructor(private readonly games: Game[] = []) {}

  async findAll(): Promise<Game[]> {
    return [...this.games];
  }

  async findById(id: string): Promise<Game | null> {
    return this.games.find((game) => game.id === id) ?? null;
  }
}
