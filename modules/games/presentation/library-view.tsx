"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Game } from "../domain/game";
import { filterGames } from "../domain/filter-games";
import { GameCard } from "./game-card";

interface LibraryViewProps {
  games: Game[];
  categories: string[];
  /** Mensaje si la carga en el servidor falló; muestra el estado de error con reintento. */
  error?: string | null;
}

export function LibraryView({ games, categories, error = null }: LibraryViewProps) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("TODOS");

  const filtered = useMemo(() => filterGames(games, q, cat), [games, q, cat]);

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      {error ? (
        <div role="alert" style={{ textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
          <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>
            ERROR AL CARGAR
          </div>
          <div style={{ marginBottom: 20 }}>{error}</div>
          <button
            className="btn"
            disabled={retrying}
            onClick={() => startRetry(() => router.refresh())}
          >
            {retrying ? "REINTENTANDO…" : "REINTENTAR"}
          </button>
        </div>
      ) : (
        <>
          <div className="av-filters">
            <div className="av-search">
              <span className="ico">⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar un juego por nombre…"
                aria-label="Buscar un juego"
              />
            </div>
            <div className="av-chips">
              {categories.map((c) => (
                <button
                  key={c}
                  className={"chip" + (cat === c ? " active" : "")}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="av-grid">
            {filtered.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
                <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>
                  NO HAY RESULTADOS
                </div>
                <div>Intenta otra búsqueda o categoría.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
