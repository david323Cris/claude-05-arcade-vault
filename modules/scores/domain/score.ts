import { ValidationError } from "@/shared/kernel/errors";

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

const NAME_MAX_LENGTH = 10;

/** Nombre de la puntuación: se recorta, debe tener 1–10 caracteres y se pasa a MAYÚSCULAS. */
export function normalizePlayerName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > NAME_MAX_LENGTH) {
    throw new ValidationError(`El nombre debe tener entre 1 y ${NAME_MAX_LENGTH} caracteres.`);
  }
  return trimmed.toUpperCase();
}

/** La puntuación debe ser un entero >= 0. */
export function validateScoreValue(score: number): void {
  if (!Number.isSafeInteger(score) || score < 0) {
    throw new ValidationError("La puntuación debe ser un número entero mayor o igual a 0.");
  }
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
