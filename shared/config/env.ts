import path from "node:path";

/** Carpeta de los JSON. `DATA_DIR` la sobrescribe (los tests la usan para aislarse). */
export function getDataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

/** Base de la API para peticiones hechas desde el servidor. */
export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL || "http://localhost:3000";
}
