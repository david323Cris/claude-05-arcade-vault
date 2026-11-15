import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, httpRequest } from "./http-client";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.API_BASE_URL;
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
// Un Response solo se puede leer una vez: cada llamada recibe uno nuevo.
const respondWith = (make: () => Response) => fetchMock.mockImplementation(async () => make());
const failure = (promise: Promise<unknown>): Promise<ApiError> =>
  promise.then(
    () => {
      throw new Error("Se esperaba que la petición fallara.");
    },
    (e: unknown) => e as ApiError,
  );

describe("httpRequest", () => {
  it("en servidor usa API_BASE_URL (por defecto http://localhost:3000)", async () => {
    respondWith(() => json({ ok: true }));
    await httpRequest("/api/games");
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/api/games");

    process.env.API_BASE_URL = "https://api.vault.gg/";
    await httpRequest("/api/games");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.vault.gg/api/games");
  });

  it("en el navegador usa rutas relativas", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValue(json([]));
    await httpRequest("/api/games");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games");
  });

  it("GET por defecto, sin cuerpo", async () => {
    fetchMock.mockResolvedValue(json([1]));
    expect(await httpRequest("/api/x")).toEqual([1]);
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });

  it("POST envía el cuerpo como JSON", async () => {
    fetchMock.mockResolvedValue(json({ id: 1 }, 201));
    await httpRequest("/api/x", { method: "POST", body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe('{"a":1}');
  });

  it("204 devuelve undefined", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await httpRequest("/api/x", { method: "POST" })).toBeUndefined();
  });

  it("convierte { error } en ApiError con ese mensaje y el status", async () => {
    fetchMock.mockResolvedValue(json({ error: "Juego no encontrado." }, 404));
    const error = await failure(httpRequest("/api/x"));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Juego no encontrado.");
    expect(error.status).toBe(404);
  });

  it("un error sin JSON usa un mensaje genérico", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    const error = await failure(httpRequest("/api/x"));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toBe("La petición falló (500).");
  });

  it("un fallo de red se convierte en ApiError (status 0)", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const error = await failure(httpRequest("/api/x"));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });
});
