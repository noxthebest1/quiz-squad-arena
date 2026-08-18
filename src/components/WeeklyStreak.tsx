import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game/store";
import { catalogWith } from "@/lib/game/catalog";

const DAYS = ["L", "M", "M", "G", "V", "S", "D"];

export function WeeklyStreak() {
  const { state, hydrated, settings } = useGame();
  const done = hydrated ? state.streakDays : 0;
  const prize = settings.streakPrize;
  const catalog = catalogWith(settings.customAssets);
  const prizeItem = prize.itemId ? catalog.all.find((i) => i.id === prize.itemId) : undefined;
  const frozen = hydrated && state.streakFrozen && done < 7;

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
                {isPrize ? prize.emoji : complete ? "✓" : d}
              </div>
              <span className="text-[10px] text-muted-foreground">{d}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-coin/60 bg-coin/10 p-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-card text-3xl shadow-pop ring-4 ring-coin">
          {prize.emoji}
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold">Premio 7° giorno · {prize.label}</p>
          <p className="text-xs text-muted-foreground">{prize.description}</p>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
            {prize.credits ? `🪙 ${prize.credits} crediti` : ""}
            {prizeItem ? `${prize.credits ? " · " : ""}🎁 ${prizeItem.name}` : ""}
          </p>
        </div>
      </div>

      {frozen && (
        <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
          ❄️ Streak congelata al giorno {done}: hai saltato un giorno. Riparte dopo un reset dell'admin.
        </p>
      )}
    </div>
  );
}
