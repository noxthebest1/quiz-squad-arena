import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGame, isMonday, TEAMS } from "@/lib/game/store";
import { assignedTeam, swapAllowed } from "@/lib/game/roster";
import type { TeamId } from "@/lib/game/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/squadra")({
  head: () => ({
    meta: [
      { title: "Squadra settimanale — Quiz Squad" },
      { name: "description", content: "Scegli o accetta la tua squadra: la scelta resta bloccata per tutta la settimana." },
      { property: "og:title", content: "Squadra settimanale — Quiz Squad" },
      { property: "og:description", content: "Fulmini o Comete: bilanciamento 50/50 e blocco settimanale." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { state, chooseTeam, hydrated } = useGame();
  const [watching, setWatching] = useState(false);
  const monday = isMonday();
  const proposed = assignedTeam();
  const canSwap = swapAllowed();

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

  function pick(team: TeamId, message: string) {
    chooseTeam(team);
    toast.success(message);
  }

  if (monday) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl">Lunedì: scelta libera</h1>
          <p className="text-sm text-muted-foreground">
            Scegli la tua squadra: sarà bloccata per tutta la settimana.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.values(TEAMS) as (typeof TEAMS)[TeamId][]).map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id, `Benvenuto nei ${t.name}!`)}
              className="card-fun group p-6 text-center transition-transform hover:-translate-y-1"
            >
              <div className={cn("mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl", t.colorClass)}>
                {t.emoji}
              </div>
              <h2 className="mt-3 text-xl">{t.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Tocca per unirti</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const other: TeamId = proposed === "fulmini" ? "comete" : "fulmini";
  const pt = TEAMS[proposed];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl">La tua squadra assegnata</h1>
        <p className="text-sm text-muted-foreground">
          Da martedì a domenica le squadre vengono bilanciate al 50/50.
        </p>
      </header>

      <div className="card-fun p-6 text-center">
        <div className={cn("mx-auto grid h-24 w-24 place-items-center rounded-full text-5xl", pt.colorClass)}>
          {pt.emoji}
        </div>
        <h2 className="mt-3 text-2xl">{pt.name}</h2>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Button
            className="w-full max-w-xs rounded-xl font-bold"
            onClick={() => pick(proposed, `Sei ufficialmente nei ${pt.name}!`)}
          >
            Accetta la squadra
          </Button>

          {canSwap ? (
            <Button
              variant="outline"
              className="w-full max-w-xs rounded-xl font-bold"
              disabled={watching}
              onClick={() => {
                setWatching(true);
                toast("Video in riproduzione…");
                window.setTimeout(() => {
                  setWatching(false);
                  pick(other, `Cambio effettuato: ora sei nei ${TEAMS[other].name}!`);
                }, 2000);
              }}
            >
              {watching ? "Video in corso…" : "Cambia squadra (Guarda Video) 📺"}
            </Button>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">L'altra squadra è al completo</p>
          )}
        </div>
      </div>
    </div>
  );
}
