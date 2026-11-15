import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameDetailView } from "@/modules/games";
import { gamesGateway } from "@/modules/games/composition.client";
import { Leaderboard } from "@/modules/scores";
import { scoresGateway } from "@/modules/scores/composition.client";

export const metadata: Metadata = { title: "Detalle del juego" };

const isNotFound = (e: unknown) => (e as { status?: number } | null)?.status === 404;

async function Detail({ params }: { params: PageProps<"/games/[id]">["params"] }) {
  const { id } = await params;
  const [game, scores] = await Promise.all([
    gamesGateway.get(id).catch((e: unknown) => {
      if (isNotFound(e)) return null;
      throw e;
    }),
    scoresGateway.list(id, 10).catch((e: unknown) => {
      if (isNotFound(e)) return null;
      throw e;
    }),
  ]);
  if (!game || !scores) notFound();

  return (
    <GameDetailView game={game}>
      <Leaderboard entries={scores.entries} />
    </GameDetailView>
  );
}

export default function GamePage(props: PageProps<"/games/[id]">) {
  return (
    <Suspense fallback={<p className="pixel" style={{ padding: 80, textAlign: "center" }}>CARGANDO…</p>}>
      <Detail params={props.params} />
    </Suspense>
  );
}
