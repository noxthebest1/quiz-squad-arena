import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerChip } from "@/components/PlayerChip";
import { useGame, TEAMS } from "@/lib/game/store";
import { RIVALS } from "@/lib/game/roster";
import type { TeamId } from "@/lib/game/catalog";
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

function LeaderboardPage() {
  const { state, avatar, frameClass, title, hydrated } = useGame();

  const players = [
    ...RIVALS,
    {
      id: "me",
      name: hydrated ? state.nickname : "Tu",
      avatar,
      frameClass,
      title,
      team: state.team ?? "fulmini",
      points: hydrated ? state.points : 0,
    },
  ].sort((a, b) => b.points - a.points);

  const teamTotals = (Object.keys(TEAMS) as TeamId[]).map((id) => ({
    id,
    points: players.filter((p) => p.team === id).reduce((s, p) => s + p.points, 0),
  })).sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl">Classifiche</h1>
        <p className="text-sm text-muted-foreground">Stagione in corso</p>
      </header>

      <Tabs defaultValue="generale">
        <TabsList className="w-full">
          <TabsTrigger value="generale" className="flex-1">Generale</TabsTrigger>
          <TabsTrigger value="squadre" className="flex-1">Squadre</TabsTrigger>
        </TabsList>

        <TabsContent value="generale" className="mt-4 space-y-3">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "card-fun grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3",
                p.id === "me" && "border-primary",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted font-display font-extrabold">
                {i === 0 ? "👑" : i + 1}
              </span>
              <PlayerChip name={p.name} avatar={p.avatar} frameClass={p.frameClass} title={p.title} team={p.team as TeamId} size="sm" />
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
