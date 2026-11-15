// Sin imports de Node: este módulo también entra en el bundle del navegador (vía http-client).

/** Carpeta de los JSON. `DATA_DIR` la sobrescribe (los tests la usan para aislarse). */
export function getDataDir(): string {
  return process.env.DATA_DIR || `${process.cwd()}/data`;
}

/** Base de la API para peticiones hechas desde el servidor. */
export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL || "http://localhost:3000";
}
