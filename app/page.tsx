import type { Metadata } from "next";
import { Suspense } from "react";
import type { Game } from "@/modules/games";
import { gamesGateway } from "@/modules/games/composition.client";
import { HomeView } from "./_components/home/home-view";

export const metadata: Metadata = { title: { absolute: "Arcade Vault · El arcade clásico está de vuelta" } };

async function loadGames(): Promise<{ games: Game[]; error: string | null }> {
  try {
    return { games: await gamesGateway.list(), error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "No se pudieron cargar los juegos.";
    return { games: [], error };
  }
}

async function Home() {
  const { games, error } = await loadGames();
  return <HomeView games={games} error={error} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<p className="pixel" style={{ padding: 80, textAlign: "center" }}>CARGANDO…</p>}>
      <Home />
    </Suspense>
  );
}
