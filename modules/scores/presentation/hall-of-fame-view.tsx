"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { scoresGateway } from "../composition.client";
import { buildPodium } from "../domain/build-podium";
import type { ScoreEntry, YourBest } from "../domain/score";

export interface HallGame {
  id: string;
  title: string;
}

interface HallOfFameViewProps {
  games: HallGame[];
  /** Nombre del jugador con sesión (lo aporta la página); null si no hay sesión. */
  playerName?: string | null;
  /** Mensaje si la lista de juegos no pudo cargarse. */
  error?: string | null;
}

const ROWS = 12;
const TOP_CLASS = ["top1", "top2", "top3"];

type Result =
  | { key: string; status: "ok"; entries: ScoreEntry[]; you: YourBest | null }
  | { key: string; status: "error"; message: string };

const fmt = (n: number) => n.toLocaleString("es-ES");
const pad = (n: number) => String(n).padStart(2, "0");

export function HallOfFameView({ games, playerName = null, error = null }: HallOfFameViewProps) {
  const [tab, setTab] = useState(games[0]?.id ?? "");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  // `playerName` entra en la clave: al resolverse la sesión se vuelve a pedir `you`.
  const key = `${tab}|${playerName ?? ""}|${attempt}`;

  useEffect(() => {
    if (!tab) return;
    let active = true;
    scoresGateway
      .list(tab, ROWS)
      .then((r) => {
        if (active) setResult({ key, status: "ok", entries: r.entries, you: r.you });
      })
      .catch((e: unknown) => {
        if (active) {
          setResult({
            key,
            status: "error",
            message: e instanceof Error ? e.message : "No se pudieron cargar las puntuaciones.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [tab, key]);

  const current = result && result.key === key ? result : null;
  const game = games.find((g) => g.id === tab);
  const podium = current?.status === "ok" ? buildPodium(current.entries) : null;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      {error && (
        <div role="alert" style={{ textAlign: "center", padding: 40, color: "var(--magenta)" }}>
          {error}
        </div>
      )}

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {!current && tab && (
        <p className="pixel" role="status" style={{ padding: 60, textAlign: "center", fontSize: 11 }}>
          CARGANDO…
        </p>
      )}

      {current?.status === "error" && (
        <div role="alert" style={{ textAlign: "center", padding: 60, color: "var(--ink-faint)" }}>
          <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>
            ERROR AL CARGAR
          </div>
          <div style={{ marginBottom: 20 }}>{current.message}</div>
          <button className="btn" onClick={() => setAttempt((a) => a + 1)}>
            REINTENTAR
          </button>
        </div>
      )}

      {current?.status === "ok" && podium && (
        <>
          <div className="podium">
            <div className="podium-slot silver">
              <div className="rank-num">02</div>
              <div className="name">{podium.silver?.name ?? "—"}</div>
              <div className="score">{podium.silver ? fmt(podium.silver.score) : "—"}</div>
              <div className="date">{podium.silver?.date ?? ""}</div>
            </div>
            <div className="podium-slot gold">
              <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>
                CAMPEÓN
              </div>
              <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>01</div>
              <div className="name">{podium.gold?.name ?? "—"}</div>
              <div className="score" style={{ fontSize: 20 }}>
                {podium.gold ? fmt(podium.gold.score) : "—"}
              </div>
              <div className="date">{podium.gold?.date ?? ""}</div>
            </div>
            <div className="podium-slot bronze">
              <div className="rank-num">03</div>
              <div className="name">{podium.bronze?.name ?? "—"}</div>
              <div className="score">{podium.bronze ? fmt(podium.bronze.score) : "—"}</div>
              <div className="date">{podium.bronze?.date ?? ""}</div>
            </div>
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {current.entries.map((r, i) => (
              <div
                key={`${tab}-${r.rank}`}
                className={("tr " + (TOP_CLASS[i] ?? "")).trim()}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{pad(r.rank)}</div>
                <div className="pl">{r.name}</div>
                <div className="sc">{fmt(r.score)}</div>
                <div className="dt">{r.date}</div>
              </div>
            ))}
            {playerName && (
              <>
                <div className="tr you-label">▸ TU MEJOR MARCA EN {game?.title}</div>
                {current.you ? (
                  <div className="tr you" style={{ animationDelay: `${current.entries.length * 50 + 50}ms` }}>
                    <div className="rk" style={{ color: "var(--yellow)" }}>#{pad(current.you.rank)}</div>
                    <div className="pl" style={{ color: "var(--yellow)" }}>{playerName}</div>
                    <div
                      className="sc"
                      style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}
                    >
                      {fmt(current.you.score)}
                    </div>
                    <div className="dt">{current.you.date}</div>
                  </div>
                ) : (
                  <div className="tr you">
                    <div className="pl" style={{ color: "var(--yellow)", gridColumn: "1 / -1" }}>
                      AÚN SIN MARCA
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link className="btn lg" href="/games">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
