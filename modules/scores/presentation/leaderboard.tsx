import type { ScoreEntry } from "../domain/score";

const TOP_CLASS: Record<number, string> = { 0: " top1", 1: " top2", 2: " top3" };

export function Leaderboard({ entries }: { entries: ScoreEntry[] }) {
  return (
    <div className="leaderboard">
      <h3>MEJORES PUNTUACIONES</h3>
      {entries.map((r, i) => (
        <div key={`${r.rank}-${r.name}`} className={"lb-row" + (TOP_CLASS[i] ?? "")}>
          <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
          <div className="pl">
            {r.name}
            <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>{r.date}</div>
          </div>
          <div className="sc">{r.score.toLocaleString("es-ES")}</div>
        </div>
      ))}
      {entries.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>
          Aún no hay puntuaciones.
        </div>
      )}
    </div>
  );
}
