import { describe, expect, it } from "vitest";
import { bestOf, rankScores, type StoredScore } from "./score";

const stored: StoredScore[] = [
  { name: "A", score: 100, date: "01/01/2026" },
  { name: "B", score: 300, date: "02/01/2026" },
  { name: "C", score: 200, date: "03/01/2026" },
  { name: "A", score: 50, date: "04/01/2026" },
];

describe("rankScores", () => {
  it("ordena de mayor a menor con rangos 1..n", () => {
    const ranked = rankScores(stored);
    expect(ranked.map((r) => r.score)).toEqual([300, 200, 100, 50]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it("no muta la entrada y mantiene el orden en empates", () => {
    const input: StoredScore[] = [
      { name: "X", score: 10, date: "01/01/2026" },
      { name: "Y", score: 10, date: "02/01/2026" },
    ];
    const copy = structuredClone(input);
    expect(rankScores(input).map((r) => r.name)).toEqual(["X", "Y"]);
    expect(input).toEqual(copy);
  });

  it("devuelve [] sin puntuaciones", () => {
    expect(rankScores([])).toEqual([]);
  });
});

describe("bestOf", () => {
  const ranked = rankScores(stored);

  it("devuelve la mejor marca y su rango", () => {
    expect(bestOf(ranked, "A")).toEqual({ rank: 3, score: 100, date: "01/01/2026" });
  });

  it("ignora mayúsculas/minúsculas", () => {
    expect(bestOf(ranked, "b")).toEqual({ rank: 1, score: 300, date: "02/01/2026" });
  });

  it("devuelve null si el jugador no tiene puntuaciones", () => {
    expect(bestOf(ranked, "Z")).toBeNull();
  });
});
