import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach } from "vitest";
import {
  describeCategoryRepositoryContract,
  describeGameRepositoryContract,
} from "../../testing/repositories.contract";
import { JsonCategoryRepository } from "./json-category-repository";
import { JsonGameRepository } from "./json-game-repository";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "av-games-"));
  process.env.DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.DATA_DIR;
  await fs.rm(dir, { recursive: true, force: true });
});

describeGameRepositoryContract("Json", async (games) => {
  await fs.writeFile(path.join(dir, "games.json"), JSON.stringify(games));
  return new JsonGameRepository();
});

describeCategoryRepositoryContract("Json", async (categories) => {
  await fs.writeFile(path.join(dir, "categories.json"), JSON.stringify(categories));
  return new JsonCategoryRepository();
});
