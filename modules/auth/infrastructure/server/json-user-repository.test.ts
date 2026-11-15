import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach } from "vitest";
import { describeUserRepositoryContract } from "../../testing/contracts";
import { JsonUserRepository } from "./json-user-repository";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "av-users-"));
  process.env.DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.DATA_DIR;
  await fs.rm(dir, { recursive: true, force: true });
});

describeUserRepositoryContract("Json", async (users) => {
  await fs.writeFile(path.join(dir, "users.json"), JSON.stringify(users));
  return new JsonUserRepository();
});
