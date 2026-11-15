import { notFound } from "next/navigation";
import { Suspense } from "react";
import { gamesGateway } from "@/modules/games/composition.client";
import { PlayerScreen } from "@/modules/play";

async function Player({ params }: { params: PageProps<"/juegos/[id]/jugar">["params"] }) {
  const { id } = await params;
  const game = await gamesGateway.get(id).catch((e: unknown) => {
    if ((e as { status?: number } | null)?.status === 404) return null;
    throw e;
  });
  if (!game) notFound();
  return <PlayerScreen game={{ id: game.id, title: game.title }} />;
}

export default function PlayPage(props: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<p className="pixel" style={{ padding: 80, textAlign: "center" }}>CARGANDO…</p>}>
      <Player params={props.params} />
    </Suspense>
  );
}
