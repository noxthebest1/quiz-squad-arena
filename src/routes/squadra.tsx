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
  const [busy, setBusy] = useState<TeamId | null>(null);
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

  const teams = Object.values(TEAMS) as (typeof TEAMS)[TeamId][];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl">{monday ? "Lunedì: scelta libera" : "Scegli la tua squadra"}</h1>
        <p className="text-sm text-muted-foreground">
          {monday
            ? "Scegli la tua squadra: sarà bloccata per tutta la settimana."
            : `Da martedì a domenica le squadre vengono bilanciate al 50/50: ti consigliamo i ${TEAMS[proposed].name}.`}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((t) => {
          const suggested = !monday && t.id === proposed;
          const needsVideo = !monday && t.id !== proposed;
          const blocked = needsVideo && !canSwap;
          return (
            <div
              key={t.id}
              className={cn("card-fun flex flex-col items-center p-6 text-center", suggested && "border-primary")}
            >
              <div className={cn("grid h-20 w-20 place-items-center rounded-full text-4xl", t.colorClass)}>
                {t.emoji}
              </div>
              <h2 className="mt-3 text-xl">{t.name}</h2>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">
                {monday
                  ? "Scelta libera"
                  : suggested
                    ? "Squadra assegnata ⭐"
                    : blocked
                      ? "Al completo"
                      : "Disponibile guardando un video"}
              </p>
              <Button
                className="mt-auto w-full rounded-xl font-bold"
                variant={suggested || monday ? "default" : "outline"}
                disabled={blocked || busy !== null}
                onClick={() =>
                  pick(
                    t.id,
                    monday || suggested
                      ? `Benvenuto nei ${t.name}!`
                      : `Cambio effettuato: ora sei nei ${t.name}!`,
                    needsVideo ? 2000 : 0,
                  )
                }
              >
                {busy === t.id
                  ? "Attendi…"
                  : monday
                    ? "Unisciti"
                    : suggested
                      ? "Accetta la squadra"
                      : "Cambia squadra 📺"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
