import { getApiBaseUrl } from "@/shared/config/env";

/** Error de una respuesta HTTP no exitosa; `message` es el `{ error }` de la API. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface HttpRequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

/** En servidor usa `API_BASE_URL`; en el navegador, rutas relativas. */
function resolveUrl(path: string): string {
  if (typeof window !== "undefined") return path;
  return `${getApiBaseUrl().replace(/\/+$/, "")}${path}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "error" in data) {
      const { error } = data as { error: unknown };
      if (typeof error === "string" && error) return error;
    }
  } catch {
    // cuerpo vacío o que no es JSON: se usa el mensaje genérico
  }
  return `La petición falló (${response.status}).`;
}

/** Cliente fetch único de los gateways. 204 devuelve `undefined`. */
export async function httpRequest<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  let response: Response;
  try {
    response = await fetch(resolveUrl(path), {
      method,
      cache: "no-store",
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
