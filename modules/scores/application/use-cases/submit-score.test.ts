import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "@/shared/kernel/errors";
import { sampleScores } from "../../testing/fixtures";
import { FixedClock } from "../../testing/fixed-clock";
import { InMemoryGameCatalog } from "../../testing/in-memory-game-catalog";
import { InMemoryScoreRepository } from "../../testing/in-memory-score-repository";
import { GetGameScores } from "./get-game-scores";
import { SubmitScore } from "./submit-score";

function setup() {
  const scores = new InMemoryScoreRepository(sampleScores);
  const catalog = new InMemoryGameCatalog(["bloque-buster", "caida"]);
  return {
    scores,
    submit: new SubmitScore(scores, catalog, new FixedClock("14/11/2026")),
    get: new GetGameScores(scores, catalog),
  };
}

describe("SubmitScore", () => {
  it("normaliza el nombre, fecha del Clock y devuelve el rango", async () => {
    const { submit } = setup();
    expect(await submit.execute({ gameId: "bloque-buster", name: "ana", score: 99999 })).toEqual({
      name: "ANA",
      score: 99999,
      date: "14/11/2026",
      rank: 1,
    });
  });

  it("calcula el rango correcto en medio del ranking", async () => {
    const { submit } = setup();
    // existentes: 9000, 7000, 5000, 3000
    const entry = await submit.execute({ gameId: "bloque-buster", name: "Zed", score: 6000 });
    expect(entry.rank).toBe(3);
  });

  it("en un empate queda después de las entradas existentes", async () => {
    const { submit } = setup();
    expect((await submit.execute({ gameId: "bloque-buster", name: "zed", score: 7000 })).rank).toBe(3);
  });

  it("la puntuación nueva aparece en el GET con su rango", async () => {
    const { submit, get } = setup();
    await submit.execute({ gameId: "bloque-buster", name: "ana", score: 8000 });
    const { entries } = await get.execute({ gameId: "bloque-buster" });
    expect(entries.map((e) => [e.name, e.rank])).toEqual([
      ["PX_KAI", 1],
      ["ANA", 2],
      ["GLITCHA", 3],
      ["NEONFOX", 4],
      ["PX_KAI", 5],
    ]);
  });

  it("acepta score 0 y un juego sin puntuaciones previas", async () => {
    const { submit } = setup();
    expect(await submit.execute({ gameId: "caida", name: "a", score: 0 })).toMatchObject({
      name: "A",
      score: 0,
      rank: 1,
    });
  });

  it.each([
    ["nombre vacío", { name: "", score: 10 }],
    ["nombre solo espacios", { name: "   ", score: 10 }],
    ["nombre de 11 caracteres", { name: "ABCDEFGHIJK", score: 10 }],
    ["score negativo", { name: "ana", score: -1 }],
    ["score decimal", { name: "ana", score: 1.5 }],
    ["score NaN", { name: "ana", score: Number.NaN }],
    ["score infinito", { name: "ana", score: Number.POSITIVE_INFINITY }],
  ])("%s → ValidationError y no guarda nada", async (_label, input) => {
    const { submit, scores } = setup();
    await expect(submit.execute({ gameId: "bloque-buster", ...input })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(await scores.listByGame("bloque-buster")).toHaveLength(4);
  });

  it("un nombre de exactamente 10 caracteres es válido", async () => {
    const { submit } = setup();
    expect((await submit.execute({ gameId: "caida", name: "abcdefghij", score: 1 })).name).toBe(
      "ABCDEFGHIJ",
    );
  });

  it("juego inexistente → NotFoundError", async () => {
    const { submit } = setup();
    await expect(
      submit.execute({ gameId: "xyz", name: "ana", score: 10 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
