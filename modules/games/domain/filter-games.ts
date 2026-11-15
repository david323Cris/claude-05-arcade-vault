import type { Game } from "./game";

export const ALL_CATEGORIES = "TODOS";

/** Filtra por categoría ("TODOS" no filtra) y por texto contenido en el título. */
export function filterGames(games: Game[], query: string, category: string): Game[] {
  const q = query.trim().toLowerCase();
  return games.filter(
    (g) =>
      (category === ALL_CATEGORIES || g.cat === category) &&
      g.title.toLowerCase().includes(q),
  );
}
