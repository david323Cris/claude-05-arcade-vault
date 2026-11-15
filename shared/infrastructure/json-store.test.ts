import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readJson, updateJson, writeJson } from "./json-store";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "av-json-"));
  process.env.DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.DATA_DIR;
  await fs.rm(dir, { recursive: true, force: true });
});

describe("json-store", () => {
  it("lee un archivo JSON de DATA_DIR", async () => {
    await fs.writeFile(path.join(dir, "a.json"), JSON.stringify({ ok: true }));
    expect(await readJson("a.json")).toEqual({ ok: true });
  });

  it("escribe de forma atómica sin dejar temporales", async () => {
    await writeJson("a.json", [1, 2, 3]);
    expect(await readJson("a.json")).toEqual([1, 2, 3]);
    expect(await fs.readdir(dir)).toEqual(["a.json"]);
  });

  it("no corrompe el archivo con escrituras concurrentes", async () => {
    await writeJson("a.json", []);
    await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        updateJson<number[]>("a.json", (list) => [...list, i]),
      ),
    );
    const result = await readJson<number[]>("a.json");
    expect([...result].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, i) => i),
    );
  });

  it("escrituras directas simultáneas dejan un JSON válido", async () => {
    await Promise.all(Array.from({ length: 20 }, (_, i) => writeJson("a.json", { i })));
    const raw = await fs.readFile(path.join(dir, "a.json"), "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("un updater que falla no altera el archivo ni bloquea la cola", async () => {
    await writeJson("a.json", [1]);
    await expect(
      updateJson("a.json", () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await updateJson<number[]>("a.json", (l) => [...l, 2]);
    expect(await readJson("a.json")).toEqual([1, 2]);
  });
});
