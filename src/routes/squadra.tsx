import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGame, isMonday } from "@/lib/game/store";
import { fetchLeaderboard } from "@/lib/game/game.functions";
import { assignedTeamFrom, swapAllowedFrom, EMPTY_COUNTS, type TeamCounts } from "@/lib/game/roster";
import type { TeamId } from "@/lib/game/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/squadra")({
  head: () => ({
    meta: [
      { title: "Squadra settimanale — Quiz Squad" },
      { name: "description", content: "Scegli o accetta la tua squadra: la scelta resta bloccata per tutta la settimana." },
      { property: "og:title", content: "Squadra settimanale — Quiz Squad" },
      { property: "og:description", content: "Bilanciamento dinamico delle squadre e blocco settimanale." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { state, chooseTeam, hydrated, teams: TEAMS } = useGame();
  const [busy, setBusy] = useState<TeamId | null>(null);
  const [counts, setCounts] = useState<TeamCounts>(EMPTY_COUNTS);
  const monday = isMonday();

  useEffect(() => {
    let alive = true;
    void fetchLeaderboard()
      .then((res) => {
        if (alive) setCounts((res as { counts: TeamCounts }).counts);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [state.team]);

  if (!hydrated) return <p className="text-muted-foreground">Caricamento…</p>;

  if (state.team) {
    const t = TEAMS[state.team];
    return (
      <div className="card-fun space-y-4 p-6 text-center">
        <div className={cn("mx-auto grid h-24 w-24 place-items-center rounded-full text-5xl", t.colorClass)}>
          {t.emoji}
        </div>
        <h1 className="text-2xl">Sei nei {t.name}!</h1>
        <p className="text-sm text-muted-foreground">
          La squadra è definitiva fino a domenica. Ora puoi giocare ai quiz.
        </p>
        <Button asChild className="rounded-xl font-bold">
          <Link to="/quiz">Vai ai quiz</Link>
        </Button>
      </div>
    );
  }

  const proposed = assignedTeamFrom(counts);
  const other: TeamId = proposed === "fulmini" ? "comete" : "fulmini";
  const canSwap = swapAllowedFrom(counts, proposed, other);

  async function pick(team: TeamId, message: string, delay = 0) {
    setBusy(team);
    try {
      if (delay) {
        toast("Video in riproduzione…");
        await new Promise((r) => window.setTimeout(r, delay));
      }
      await chooseTeam(team);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scelta non riuscita");
    } finally {
      setBusy(null);
    }
  }

  if (monday) {
    const teams = Object.values(TEAMS) as (typeof TEAMS)[TeamId][];
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl">Lunedì: scelta libera</h1>
          <p className="text-sm text-muted-foreground">
            Scegli la tua squadra: sarà bloccata per tutta la settimana.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((t) => (
            <div key={t.id} className="card-fun flex flex-col items-center p-6 text-center">
              <div className={cn("grid h-20 w-20 place-items-center rounded-full text-4xl", t.colorClass)}>
                {t.emoji}
              </div>
              <h2 className="mt-3 text-xl">{t.name}</h2>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">Scelta libera</p>
              <Button
                className="mt-auto w-full rounded-xl font-bold"
                disabled={busy !== null}
                onClick={() => pick(t.id, `Benvenuto nei ${t.name}!`)}
              >
                {busy === t.id ? "Attendi…" : "Unisciti"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const p = TEAMS[proposed];
  const o = TEAMS[other];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl">Squadra assegnata</h1>
        <p className="text-sm text-muted-foreground">
          Da martedì a domenica le squadre vengono bilanciate automaticamente: ti sono stati assegnati i {p.name}.
        </p>
      </header>

      <div className="card-fun flex flex-col items-center p-6 text-center">
        <div className={cn("grid h-24 w-24 place-items-center rounded-full text-5xl", p.colorClass)}>{p.emoji}</div>
        <h2 className="mt-3 text-xl">{p.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {p.name}: {counts[proposed]} membri · {o.name}: {counts[other]} membri
        </p>

        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            className="rounded-xl font-bold"
            disabled={busy !== null}
            onClick={() => pick(proposed, `Benvenuto nei ${p.name}!`)}
          >
            {busy === proposed ? "Attendi…" : "Accetta la squadra"}
          </Button>
          {canSwap ? (
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              disabled={busy !== null}
              onClick={() => pick(other, `Cambio effettuato: ora sei nei ${o.name}!`, 2000)}
            >
              {busy === other ? "Attendi…" : "Cambia squadra (Guarda Video)"}
            </Button>
          ) : (
            <p className="self-center text-sm font-bold text-muted-foreground">L'altra squadra è al completo</p>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Dopo la conferma la squadra è definitiva e non può più essere modificata.
        </p>
      </div>
    </div>
  );
}
