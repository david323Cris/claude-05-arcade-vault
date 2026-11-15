import type { ScoreEntry } from "./score";

export interface Podium {
  gold: ScoreEntry | null;
  silver: ScoreEntry | null;
  bronze: ScoreEntry | null;
}

/** Top 3 de una lista ya ordenada de mayor a menor; los puestos sin jugador son null. */
export function buildPodium(entries: ScoreEntry[]): Podium {
  return {
    gold: entries[0] ?? null,
    silver: entries[1] ?? null,
    bronze: entries[2] ?? null,
  };
}
