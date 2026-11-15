import type { Game } from "../domain/game";

export const sampleGames: Game[] = [
  {
    id: "bloque-buster",
    title: "BLOQUE BUSTER",
    short: "Rebota la pelota.",
    long: "Destruye muros de neón.",
    cat: "ARCADE",
    cover: "cover-bricks",
    color: "cyan",
    best: 28450,
    plays: "12.4K",
  },
  {
    id: "caida",
    title: "CAÍDA",
    short: "Encaja las piezas.",
    long: "Limpia líneas para sobrevivir.",
    cat: "PUZZLE",
    cover: "cover-tetro",
    color: "magenta",
    best: 184220,
    plays: "31.8K",
  },
];

export const sampleCategories: string[] = ["TODOS", "ARCADE", "PUZZLE"];
