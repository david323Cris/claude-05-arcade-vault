"use client";

import { useSession } from "@/modules/auth";
import { HallOfFameView } from "@/modules/scores";
import type { HallGame } from "@/modules/scores";

/** Une `auth` y `scores`: los módulos no se importan entre sí, lo hace la app. */
export function HallOfFameScreen({ games, error }: { games: HallGame[]; error?: string | null }) {
  const { user } = useSession();
  return <HallOfFameView games={games} playerName={user?.name ?? null} error={error} />;
}
