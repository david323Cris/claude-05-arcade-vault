import type { StoredScore } from "../domain/score";

/** Desordenado a propósito: el rango se calcula al leer. */
export const sampleScores: Record<string, StoredScore[]> = {
  "bloque-buster": [
    { name: "NEONFOX", score: 5000, date: "01/01/2026" },
    { name: "PX_KAI", score: 9000, date: "02/01/2026" },
    { name: "GLITCHA", score: 7000, date: "03/01/2026" },
    { name: "PX_KAI", score: 3000, date: "04/01/2026" },
  ],
  caida: [],
};
