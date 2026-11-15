import "server-only";
import { readJson } from "@/shared/infrastructure/json-store";
import type { GameRepository } from "../../application/ports/game-repository";
import type { Game } from "../../domain/game";

export class JsonGameRepository implements GameRepository {
  findAll(): Promise<Game[]> {
    return readJson<Game[]>("games.json");
  }

  async findById(id: string): Promise<Game | null> {
    const games = await this.findAll();
    return games.find((game) => game.id === id) ?? null;
  }
}
