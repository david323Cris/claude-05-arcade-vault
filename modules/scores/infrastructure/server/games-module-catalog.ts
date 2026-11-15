import "server-only";
import { getGame } from "@/modules/games/server";
import { NotFoundError } from "@/shared/kernel/errors";
import type { GameCatalog } from "../../application/ports/game-catalog";

/** Adapta el módulo `games` (por su API pública) al puerto GameCatalog de `scores`. */
export class GamesModuleCatalog implements GameCatalog {
  async exists(gameId: string): Promise<boolean> {
    try {
      await getGame.execute(gameId);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) return false;
      throw error;
    }
  }
}
