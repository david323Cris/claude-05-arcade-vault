import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/infrastructure/http/http-client";
import { HttpScoreSubmitter } from "./http-score-submitter";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("window", {});
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("HttpScoreSubmitter", () => {
  it("submit → POST /api/games/[id]/scores con { name, score }", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ rank: 1 }), { status: 201 }));
    await new HttpScoreSubmitter().submit("caida", { name: "PX_KAI", score: 900 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games/caida/scores");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: "PX_KAI", score: 900 });
  });

  it("propaga el ApiError de la API", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "Nombre inválido." }), { status: 400 }));
    await expect(new HttpScoreSubmitter().submit("caida", { name: "", score: 1 })).rejects.toEqual(
      new ApiError("Nombre inválido.", 400),
    );
  });
});
