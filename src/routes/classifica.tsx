import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerChip } from "@/components/PlayerChip";
import { useGame } from "@/lib/game/store";
import { fetchLeaderboard } from "@/lib/game/game.functions";
import { catalogWith, type TeamId } from "@/lib/game/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/classifica")({
  head: () => ({
    meta: [
      { title: "Classifiche — Quiz Squad" },
      { name: "description", content: "Classifica generale e classifica a squadre della stagione." },
      { property: "og:title", content: "Classifiche — Quiz Squad" },
      { property: "og:description", content: "Scopri chi guida la corsa al premio Campione e al premio Squadra." },
    ],
  }),
  component: LeaderboardPage,
});

type LeaderRow = {
  id: string;
  nickname: string;
  avatar_id: string;
  frame_id: string;
  title_id: string;
  points: number;
  team: TeamId | null;
};

function LeaderboardPage() {
  const { user, settings, teams: TEAMS } = useGame();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const catalog = catalogWith(settings.customAssets);

  useEffect(() => {
    let alive = true;
    void fetchLeaderboard()
      .then((res) => {
        if (alive) setRows((res as { players: LeaderRow[] }).players);
      })
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!rows) return <p className="text-sm text-muted-foreground">Caricamento classifica…</p>;

  const teamTotals = (Object.keys(TEAMS) as TeamId[])
    .map((id) => ({ id, points: rows.filter((p) => p.team === id).reduce((s, p) => s + p.points, 0) }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl">Classifiche</h1>
        <p className="text-sm text-muted-foreground">Stagione #{settings.season.number}</p>
      </header>

      <Tabs defaultValue="generale">
        <TabsList className="w-full">
          <TabsTrigger value="generale" className="flex-1">Generale</TabsTrigger>
          <TabsTrigger value="squadre" className="flex-1">Squadre</TabsTrigger>
        </TabsList>

        <TabsContent value="generale" className="mt-4 space-y-3">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Nessun giocatore in classifica.</p>}
          {rows.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "card-fun grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3",
                p.id === user?.id && "border-primary",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted font-display font-extrabold">
                {i === 0 ? "👑" : i + 1}
              </span>
              <PlayerChip
                name={p.nickname}
                avatar={catalog.avatars.find((a) => a.id === p.avatar_id)?.value ?? "🦊"}
                frameClass={catalog.frames.find((f) => f.id === p.frame_id)?.value ?? "ring-2 ring-border"}
                title={catalog.titles.find((t) => t.id === p.title_id)?.value ?? "Novellino"}
                team={p.team}
                size="sm"
              />
              <span className="shrink-0 font-display font-extrabold">⭐ {p.points}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="squadre" className="mt-4 grid gap-4 sm:grid-cols-2">
          {teamTotals.map((t, i) => (
            <div key={t.id} className="card-fun p-5 text-center">
              <div className={cn("mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl", TEAMS[t.id].colorClass)}>
                {TEAMS[t.id].emoji}
              </div>
              <h2 className="mt-3 text-xl">{TEAMS[t.id].name}</h2>
              <p className="text-sm text-muted-foreground">{i === 0 ? "In testa 🏆" : "Inseguimento"}</p>
              <p className="mt-2 font-display text-2xl font-extrabold">⭐ {t.points}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
