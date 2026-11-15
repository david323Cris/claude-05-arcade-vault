"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/modules/auth";
import { scoreSubmitter } from "../composition.client";
import { end, newSession, tick, togglePause } from "../domain/play-session";
import { CrtFrame } from "./crt-frame";
import { GameOverModal } from "./game-over-modal";
import type { SaveStatus } from "./game-over-modal";
import { Hud } from "./hud";

export interface PlayableGame {
  id: string;
  title: string;
}

const TICK_MS = 220;
const GUEST = "INVITADO";

export function PlayerScreen({ game }: { game: PlayableGame }) {
  const { user } = useSession();
  const [session, setSession] = useState(newSession);
  // null = sin edición manual: se usa el usuario de la sesión o INVITADO.
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const name = nameOverride ?? user?.name ?? GUEST;
  const running = !session.paused && !session.over;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const points = Math.floor(10 + Math.random() * 90);
      setSession((s) => tick(s, points));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const save = async () => {
    setStatus("saving");
    setSaveError(null);
    try {
      await scoreSubmitter.submit(game.id, { name: name.trim(), score: session.score });
      setStatus("saved");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "No se pudo guardar la puntuación.");
      setStatus("error");
    }
  };

  const restart = () => {
    setSession(newSession());
    setStatus("idle");
    setSaveError(null);
  };

  return (
    <div className="av-player fade-in">
      <Hud
        playerName={name}
        score={session.score}
        lives={session.lives}
        level={session.level}
        paused={session.paused}
        exitHref={`/juegos/${game.id}`}
        onTogglePause={() => setSession(togglePause)}
        onEnd={() => setSession(end)}
      />
      <CrtFrame title={game.title} paused={session.paused} />
      {session.over && (
        <GameOverModal
          score={session.score}
          name={name}
          status={status}
          error={saveError}
          onNameChange={setNameOverride}
          onSave={() => void save()}
          onRestart={restart}
        />
      )}
    </div>
  );
}
