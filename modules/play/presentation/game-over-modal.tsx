import Link from "next/link";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface GameOverModalProps {
  score: number;
  name: string;
  status: SaveStatus;
  error: string | null;
  onNameChange(name: string): void;
  onSave(): void;
  onRestart(): void;
}

export function GameOverModal({ score, name, status, error, onNameChange, onSave, onRestart }: GameOverModalProps) {
  return (
    <div className="modal-bd">
      <div className="modal" role="dialog" aria-modal="true" aria-label="Fin del juego">
        <h2>FIN DEL JUEGO</h2>
        <div className="final-label">PUNTUACIÓN FINAL</div>
        <div className="final" data-testid="final-score">{score.toLocaleString("es-ES")}</div>

        {status === "saved" ? (
          <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        ) : (
          <>
            <div className="input-row">
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="TUS INICIALES"
                aria-label="Tus iniciales"
                disabled={status === "saving"}
              />
              <button className="btn yellow" onClick={onSave} disabled={status === "saving"}>
                {status === "saving" ? "GUARDANDO…" : status === "error" ? "REINTENTAR" : "GUARDAR PUNTUACIÓN"}
              </button>
            </div>
            {status === "error" && (
              <div role="alert" style={{ color: "var(--magenta)", fontSize: 12, marginTop: 10 }}>
                {error}
              </div>
            )}
          </>
        )}

        <div className="actions">
          <button className="btn" onClick={onRestart}>JUGAR DE NUEVO</button>
          <Link className="btn magenta" href="/">VOLVER AL VAULT</Link>
        </div>
      </div>
    </div>
  );
}
