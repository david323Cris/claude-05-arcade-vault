import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/infrastructure/http/http-client";
import { HttpGamesGateway } from "./http-games-gateway";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("window", {}); // rutas relativas: URLs idénticas a la tabla de endpoints
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("HttpGamesGateway", () => {
  it("list → GET /api/games", async () => {
    fetchMock.mockResolvedValue(json([{ id: "caida" }]));
    expect(await new HttpGamesGateway().list()).toEqual([{ id: "caida" }]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("get → GET /api/games/[id]", async () => {
    fetchMock.mockResolvedValue(json({ id: "caida" }));
    expect(await new HttpGamesGateway().get("caida")).toEqual({ id: "caida" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games/caida");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("get codifica el id en la URL", async () => {
    fetchMock.mockResolvedValue(json({}));
    await new HttpGamesGateway().get("a/b?c");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games/a%2Fb%3Fc");
  });

  it("categories → GET /api/categories", async () => {
    fetchMock.mockResolvedValue(json(["TODOS"]));
    expect(await new HttpGamesGateway().categories()).toEqual(["TODOS"]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/categories");
  });

  it("convierte { error } en ApiError con el mensaje de la API", async () => {
    fetchMock.mockResolvedValue(json({ error: "Juego no encontrado." }, 404));
    await expect(new HttpGamesGateway().get("xyz")).rejects.toEqual(
      expect.objectContaining({ name: "ApiError", message: "Juego no encontrado.", status: 404 }),
    );
    await expect(new HttpGamesGateway().get("xyz")).rejects.toBeInstanceOf(ApiError);
  });
});
