import { httpRequest } from "@/shared/infrastructure/http/http-client";
import type { GamesGateway } from "../../application/ports/games-gateway";
import type { Game } from "../../domain/game";

export class HttpGamesGateway implements GamesGateway {
  list(): Promise<Game[]> {
    return httpRequest<Game[]>("/api/games");
  }

  get(id: string): Promise<Game> {
    return httpRequest<Game>(`/api/games/${encodeURIComponent(id)}`);
  }

  categories(): Promise<string[]> {
    return httpRequest<string[]>("/api/categories");
  }
}
