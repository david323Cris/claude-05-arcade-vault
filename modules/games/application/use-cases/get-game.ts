import { NotFoundError } from "@/shared/kernel/errors";
import type { Game } from "../../domain/game";
import type { GameRepository } from "../ports/game-repository";

export class GetGame {
  constructor(private readonly games: GameRepository) {}

  async execute(id: string): Promise<Game> {
    const game = await this.games.findById(id);
    if (!game) throw new NotFoundError("Juego no encontrado.");
    return game;
  }
}
