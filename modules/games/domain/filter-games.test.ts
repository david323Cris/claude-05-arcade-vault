import { describe, expect, it } from "vitest";
import { sampleGames } from "../testing/fixtures";
import { filterGames } from "./filter-games";

describe("filterGames", () => {
  it("sin texto y con TODOS devuelve todo", () => {
    expect(filterGames(sampleGames, "", "TODOS")).toEqual(sampleGames);
  });

  it("filtra por texto sin distinguir mayúsculas", () => {
    expect(filterGames(sampleGames, "bloque", "TODOS").map((g) => g.id)).toEqual(["bloque-buster"]);
    expect(filterGames(sampleGames, "caí", "TODOS").map((g) => g.id)).toEqual(["caida"]);
  });

  it("filtra por categoría", () => {
    expect(filterGames(sampleGames, "", "PUZZLE").map((g) => g.id)).toEqual(["caida"]);
  });

  it("combina texto y categoría", () => {
    expect(filterGames(sampleGames, "bloque", "PUZZLE")).toEqual([]);
  });

  it("sin coincidencias devuelve lista vacía", () => {
    expect(filterGames(sampleGames, "zzz", "TODOS")).toEqual([]);
  });

  it("ignora espacios alrededor del texto", () => {
    expect(filterGames(sampleGames, "  caí ", "TODOS")).toHaveLength(1);
  });
});
