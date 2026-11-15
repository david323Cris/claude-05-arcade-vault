import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/infrastructure/http/http-client";
import { HttpScoresGateway } from "./http-scores-gateway";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("window", {});
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("HttpScoresGateway", () => {
  it("list sin limit → GET /api/games/[id]/scores", async () => {
    fetchMock.mockResolvedValue(json({ entries: [], you: null }));
    expect(await new HttpScoresGateway().list("caida")).toEqual({ entries: [], you: null });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games/caida/scores");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("list con limit → ?limit=N", async () => {
    fetchMock.mockResolvedValue(json({ entries: [], you: null }));
    await new HttpScoresGateway().list("caida", 10);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games/caida/scores?limit=10");
  });

  it("submit → POST /api/games/[id]/scores con { name, score }", async () => {
    const entry = { name: "ANA", score: 10, date: "14/11/2026", rank: 1 };
    fetchMock.mockResolvedValue(json(entry, 201));
    expect(await new HttpScoresGateway().submit("caida", { name: "ana", score: 10 })).toEqual(
      entry,
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/games/caida/scores");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ name: "ana", score: 10 });
  });

  it("convierte { error } en ApiError con el mensaje de la API", async () => {
    fetchMock.mockResolvedValue(
      json({ error: "La puntuación debe ser un número entero mayor o igual a 0." }, 400),
    );
    const result = new HttpScoresGateway().submit("caida", { name: "ana", score: -1 });
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({
      message: "La puntuación debe ser un número entero mayor o igual a 0.",
      status: 400,
    });
  });
});
