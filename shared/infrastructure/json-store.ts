import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getDataDir } from "@/shared/config/env";

// Cola por archivo: las operaciones se ejecutan de una en una.
const queues = new Map<string, Promise<unknown>>();

function resolveFile(name: string): string {
  return path.join(getDataDir(), name);
}

function enqueue<T>(file: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(file) ?? Promise.resolve();
  const run = previous.then(task, task);
  queues.set(
    file,
    run.catch(() => undefined),
  );
  return run;
}

async function readFile<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

async function writeAtomic(file: string, data: unknown): Promise<void> {
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await fs.rename(tmp, file);
  } catch (error) {
    await fs.rm(tmp, { force: true });
    throw error;
  }
}

/** Lee `<DATA_DIR>/<name>` en cada llamada (sin `import`, así no hay HMR). */
export function readJson<T>(name: string): Promise<T> {
  const file = resolveFile(name);
  // Se encola para leer siempre un estado consistente respecto a escrituras pendientes.
  return enqueue(file, () => readFile<T>(file));
}

/** Escritura atómica (archivo temporal + rename), serializada. */
export function writeJson(name: string, data: unknown): Promise<void> {
  const file = resolveFile(name);
  return enqueue(file, () => writeAtomic(file, data));
}

/** Lectura-modificación-escritura serializada: dos `updateJson` simultáneos no se pisan. */
export function updateJson<T>(
  name: string,
  updater: (current: T) => T | Promise<T>,
): Promise<T> {
  const file = resolveFile(name);
  return enqueue(file, async () => {
    const next = await updater(await readFile<T>(file));
    await writeAtomic(file, next);
    return next;
  });
}
