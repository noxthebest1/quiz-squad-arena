import { createFileRoute } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missioni")({
  head: () => ({
    meta: [
      { title: "Missioni — Quiz Squad" },
      { name: "description", content: "Completa le missioni giornaliere e guadagna crediti extra." },
      { property: "og:title", content: "Missioni — Quiz Squad" },
      { property: "og:description", content: "Obiettivi quotidiani: gioca, indovina, gira la ruota e saluta la squadra." },
    ],
  }),
  component: MissionsPage,
});

const MISSIONS = [
  { id: "play3", label: "Gioca 3 quiz", goal: 3, reward: 15, icon: "🎯" },
  { id: "correct2", label: "Indovina 2 quiz", goal: 2, reward: 25, icon: "🧠" },
  { id: "spin", label: "Gira la Ruota del Mattino", goal: 1, reward: 10, icon: "🎡" },
  { id: "chat", label: "Invia un messaggio in chat", goal: 1, reward: 5, icon: "💬" },
] as const;

function MissionsPage() {
  const { state, hydrated } = useGame();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl">Missioni giornaliere</h1>
        <p className="text-sm text-muted-foreground">Si azzerano ogni giorno a mezzanotte.</p>
      </header>

      <div className="grid gap-4">
        {MISSIONS.map((m) => {
          const value = hydrated ? Math.min(state.missions[m.id], m.goal) : 0;
          const done = value >= m.goal;
          return (
            <div key={m.id} className="card-fun p-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-xl">
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display font-extrabold">{m.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {value}/{m.goal} · ricompensa 🪙 {m.reward}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                    done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? "Completata" : "In corso"}
                </span>
              </div>
              <Progress value={(value / m.goal) * 100} className="mt-3 h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
