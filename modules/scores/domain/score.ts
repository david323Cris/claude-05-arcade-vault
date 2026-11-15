/** Puntuación tal como se guarda en scores.json: el rango NO se guarda. */
export interface StoredScore {
  name: string;
  score: number;
  /** "DD/MM/YYYY" */
  date: string;
}

export interface ScoreEntry extends StoredScore {
  rank: number;
}

export interface YourBest {
  rank: number;
  score: number;
  date: string;
}

/** Ordena de mayor a menor (estable en empates) y asigna rangos 1..n. No muta la entrada. */
export function rankScores(scores: readonly StoredScore[]): ScoreEntry[] {
  return [...scores]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Mejor marca de un jugador dentro de un ranking ya ordenado, o null si no tiene. */
export function bestOf(ranked: readonly ScoreEntry[], name: string): YourBest | null {
  const wanted = name.toUpperCase();
  const best = ranked.find((entry) => entry.name.toUpperCase() === wanted);
  return best ? { rank: best.rank, score: best.score, date: best.date } : null;
}
