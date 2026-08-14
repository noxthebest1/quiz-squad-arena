import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PlayerChip } from "@/components/PlayerChip";
import { PrizeShowcase } from "@/components/PrizeShowcase";
import { MorningWheel } from "@/components/MorningWheel";
import { WeeklyStreak } from "@/components/WeeklyStreak";
import { useGame } from "@/lib/game/store";
import { RIVALS } from "@/lib/game/roster";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Quiz Squad" },
      { name: "description", content: "La tua plancia di comando: ticket, quiz del giorno, squadra e premi." },
      { property: "og:title", content: "Home — Quiz Squad" },
      { property: "og:description", content: "Ticket giornalieri, quiz a difficoltà crescente e vetrina premi." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { state, avatar, frameClass, title, ticketsLeft, bonusLeft, hydrated, teamLocked } = useGame();

  const totalRank = [
    ...RIVALS.map((r) => ({ name: r.name, points: r.points })),
    { name: state.nickname, points: state.points },
  ].sort((a, b) => b.points - a.points);
  const myPos = totalRank.findIndex((r) => r.name === state.nickname) + 1;

  return (
    <div className="space-y-6">
      <section className="card-fun overflow-hidden">
        <div className="bg-hero-gradient p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <PlayerChip
              name={hydrated ? state.nickname : "…"}
              avatar={avatar}
              frameClass={cn(frameClass, "bg-card")}
              title={title}
              team={state.team}
              size="lg"
              className="[&_span]:text-primary-foreground [&_p]:text-primary-foreground/80"
            />
            <div className="shrink-0 rounded-2xl bg-card/90 px-4 py-2 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Posizione</p>
              <p className="font-display text-2xl font-extrabold">#{hydrated ? myPos : "-"}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x-2 divide-border">
          <Stat label="Punti" value={hydrated ? state.points : 0} icon="⭐" />
          <Stat label="Crediti" value={hydrated ? state.credits : 0} icon="🪙" />
          <Stat label="Ticket" value={hydrated ? ticketsLeft + bonusLeft : 0} icon="🎟️" />
        </div>
      </section>

      {!teamLocked && hydrated && (
        <div className="card-fun flex flex-col gap-3 border-primary bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg">Scegli la squadra della settimana</h3>
            <p className="text-sm text-muted-foreground">Senza squadra non puoi giocare ai quiz.</p>
          </div>
          <Button asChild className="rounded-xl font-bold">
            <Link to="/squadra">Vai alla scelta</Link>
          </Button>
        </div>
      )}

      <section className="card-fun p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h2 className="text-xl">Quiz del giorno</h2>
            <p className="text-sm text-muted-foreground">
              {hydrated
                ? `${ticketsLeft} ticket gratuiti · ${bonusLeft} bonus disponibili`
                : "Caricamento…"}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 rounded-2xl font-extrabold shadow-pop">
            <Link to="/quiz">Gioca 🎯</Link>
          </Button>
        </div>
      </section>

      <PrizeShowcase />

      <div className="grid gap-6 md:grid-cols-2">
        <MorningWheel />
        <WeeklyStreak />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="p-4 text-center">
      <p className="text-xl">{icon}</p>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
