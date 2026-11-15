import type { Game } from "../../domain/game";
import type { GameRepository } from "../ports/game-repository";

export class ListGames {
  constructor(private readonly games: GameRepository) {}

  execute(): Promise<Game[]> {
    return this.games.findAll();
  }
}
