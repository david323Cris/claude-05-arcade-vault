import { Suspense } from "react";
import { LibraryView } from "@/modules/games";
import type { Game } from "@/modules/games";
import { gamesGateway } from "@/modules/games/composition.client";

async function loadLibrary(): Promise<{ games: Game[]; categories: string[]; error: string | null }> {
  try {
    const [games, categories] = await Promise.all([gamesGateway.list(), gamesGateway.categories()]);
    return { games, categories, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "No se pudieron cargar los juegos.";
    return { games: [], categories: [], error };
  }
}

async function Library() {
  const { games, categories, error } = await loadLibrary();
  return <LibraryView games={games} categories={categories} error={error} />;
}

export default function Home() {
  return (
    <Suspense fallback={<p className="pixel" style={{ padding: 80, textAlign: "center" }}>CARGANDO…</p>}>
      <Library />
    </Suspense>
  );
}
