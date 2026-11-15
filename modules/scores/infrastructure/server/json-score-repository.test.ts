import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { describeScoreRepositoryContract } from "../../testing/repositories.contract";
import { GamesModuleCatalog } from "./games-module-catalog";
import { JsonScoreRepository } from "./json-score-repository";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "av-scores-"));
  process.env.DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.DATA_DIR;
  await fs.rm(dir, { recursive: true, force: true });
});

describeScoreRepositoryContract("Json", async (data) => {
  await fs.writeFile(path.join(dir, "scores.json"), JSON.stringify(data));
  return new JsonScoreRepository();
});

describe("GamesModuleCatalog", () => {
  it("usa el módulo games para saber si un juego existe", async () => {
    await fs.writeFile(
      path.join(dir, "games.json"),
      JSON.stringify([{ id: "caida", title: "CAÍDA" }]),
    );
    const catalog = new GamesModuleCatalog();
    expect(await catalog.exists("caida")).toBe(true);
    expect(await catalog.exists("xyz")).toBe(false);
  });
});
