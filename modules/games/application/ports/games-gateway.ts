import type { Game } from "../../domain/game";

/** Puerto de cliente: cómo el frontend obtiene juegos y categorías. */
export interface GamesGateway {
  list(): Promise<Game[]>;
  get(id: string): Promise<Game>;
  categories(): Promise<string[]>;
}
