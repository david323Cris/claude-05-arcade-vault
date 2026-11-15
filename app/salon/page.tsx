import { Suspense } from "react";
import { gamesGateway } from "@/modules/games/composition.client";
import { HallOfFameScreen } from "../_components/hall-of-fame-screen";

async function loadGames(): Promise<{ games: { id: string; title: string }[]; error: string | null }> {
  try {
    const games = await gamesGateway.list();
    return { games: games.map(({ id, title }) => ({ id, title })), error: null };
  } catch (e) {
    return { games: [], error: e instanceof Error ? e.message : "No se pudieron cargar los juegos." };
  }
}

async function Hall() {
  const { games, error } = await loadGames();
  return <HallOfFameScreen games={games} error={error} />;
}

export default function SalonPage() {
  return (
    <Suspense fallback={<p className="pixel" style={{ padding: 80, textAlign: "center" }}>CARGANDO…</p>}>
      <Hall />
    </Suspense>
  );
}
