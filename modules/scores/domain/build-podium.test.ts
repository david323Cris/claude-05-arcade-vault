import { describe, expect, it } from "vitest";
import { buildPodium } from "./build-podium";
import type { ScoreEntry } from "./score";

const entry = (rank: number): ScoreEntry => ({
  rank,
  name: `P${rank}`,
  score: 1000 - rank,
  date: "01/01/2026",
});

describe("buildPodium", () => {
  it("toma los tres primeros como oro, plata y bronce", () => {
    const entries = [entry(1), entry(2), entry(3), entry(4)];
    expect(buildPodium(entries)).toEqual({ gold: entries[0], silver: entries[1], bronze: entries[2] });
  });

  it("deja null los puestos que faltan", () => {
    const entries = [entry(1), entry(2)];
    expect(buildPodium(entries)).toEqual({ gold: entries[0], silver: entries[1], bronze: null });
  });

  it("sin entradas devuelve todo null", () => {
    expect(buildPodium([])).toEqual({ gold: null, silver: null, bronze: null });
  });
});
