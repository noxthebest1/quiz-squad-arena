import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game/store";

const DAYS = ["L", "M", "M", "G", "V", "S", "D"];

export function WeeklyStreak() {
  const { state, hydrated } = useGame();
  const done = hydrated ? state.streakDays : 0;

  return (
    <div className="card-fun p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg">Weekly Streak</h3>
          <p className="truncate text-xs text-muted-foreground">7 giorni di fila = premio speciale</p>
        </div>
        <span className="shrink-0 rounded-full bg-coin px-3 py-1 text-xs font-bold text-coin-foreground">
          🔥 {done}/7
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((d, i) => {
          const complete = i < done;
          const isPrize = i === 6;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "grid aspect-square w-full place-items-center rounded-xl border-2 text-sm font-bold",
                  complete
                    ? "border-transparent bg-success text-success-foreground"
                    : "border-dashed border-border bg-muted text-muted-foreground",
                  isPrize && !complete && "border-coin bg-coin/20",
                )}
              >
                {isPrize ? "🎁" : complete ? "✓" : d}
              </div>
              <span className="text-[10px] text-muted-foreground">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
