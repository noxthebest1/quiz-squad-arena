import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MISSIONS } from "@/lib/game/missions";
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

function MissionsPage() {
  const { state, hydrated, claimMission } = useGame();
  const [busy, setBusy] = useState<string | null>(null);

  async function claim(id: (typeof MISSIONS)[number]["id"]) {
    setBusy(id);
    try {
      const res = await claimMission(id);
      toast.success(`Ricompensa riscattata: +${res.reward} 🪙 · +${res.points} ⭐`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Riscatto non riuscito");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl">Missioni giornaliere</h1>
        <p className="text-sm text-muted-foreground">Si azzerano ogni giorno a mezzanotte.</p>
      </header>

      <div className="grid gap-4">
        {MISSIONS.map((m) => {
          const value = hydrated ? Math.min(state.missions[m.id] ?? 0, m.goal) : 0;
          const done = value >= m.goal;
          const claimed = state.claimedMissions.includes(m.id);
          return (
            <div key={m.id} className="card-fun p-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-xl">
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display font-extrabold">{m.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {value}/{m.goal} · ricompensa 🪙 {m.reward} · ⭐ {m.points}
                  </p>
                </div>
                {claimed ? (
                  <span className="shrink-0 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">
                    Riscattata
                  </span>
                ) : done ? (
                  <Button
                    size="sm"
                    className="shrink-0 rounded-xl font-bold"
                    disabled={busy === m.id}
                    onClick={() => claim(m.id)}
                  >
                    {busy === m.id ? "…" : "Riscatta"}
                  </Button>
                ) : (
                  <span className={cn("shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground")}>
                    In corso
                  </span>
                )}
              </div>
              <Progress value={(value / m.goal) * 100} className="mt-3 h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
