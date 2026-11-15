export type HighlightIconKind = "HEART" | "BROWSER" | "PLANT";
export type HighlightColor = "magenta" | "cyan" | "green";

export interface Highlight {
  icon: HighlightIconKind;
  text: string;
  color: HighlightColor;
}

export const HIGHLIGHTS: Highlight[] = [
  { icon: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  { icon: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "cyan" },
  { icon: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];

export interface Tip {
  text: string;
  /** Clase extra del LED: "" (verde), "y" (amarillo) o "m" (magenta). */
  led: "" | "y" | "m";
}

export const TIPS: Tip[] = [
  { text: "RESPUESTA EN 24-48H", led: "" },
  { text: "SUGERENCIAS BIENVENIDAS", led: "y" },
  { text: "SIN SPAM, JAMÁS", led: "m" },
];

export const PIXEL_COUNT = 24;
