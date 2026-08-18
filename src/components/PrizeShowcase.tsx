import { useGame } from "@/lib/game/store";
import { catalogWith, frameHasCrown } from "@/lib/game/catalog";
import { cn } from "@/lib/utils";

export function PrizeShowcase() {
  const { settings, teams } = useGame();
  const catalog = catalogWith(settings.customAssets);
  const championFrame = catalog.frames.find((f) => f.id === settings.seasonPrizes.championFrameId);
  const teamTitle = catalog.titles.find((t) => t.id === settings.seasonPrizes.teamTitleId);
  const crown = frameHasCrown(settings.seasonPrizes.championFrameId, settings.customAssets);
  const streak = settings.streakPrize;
  const streakItem = streak.itemId ? catalog.all.find((i) => i.id === streak.itemId) : undefined;

  return (
    <section className="card-fun overflow-hidden">
      <div className="bg-fun-gradient px-5 py-4">
        <h2 className="text-xl text-primary-foreground">🏆 Vetrina dei Premi</h2>
        <p className="text-xs text-primary-foreground/85">
          Stagione #{settings.season.number} · {teams.fulmini.name} vs {teams.comete.name}
        </p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <div className="rounded-2xl border-2 border-coin/60 bg-coin/10 p-4 text-center">
          <div className="relative mx-auto mb-3 h-24 w-20">
            {crown && (
              <span className="crown-3d absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-2xl" aria-hidden="true">
                👑
              </span>
            )}
            <div
              className={cn(
                "absolute bottom-0 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-card text-4xl shadow-pop",
                championFrame?.value ?? "ring-4 ring-coin",
              )}
            >
              {settings.showcase.champion.emoji}
            </div>
          </div>
          <h3 className="text-base">{settings.showcase.champion.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{settings.showcase.champion.description}</p>
          {championFrame && (
            <p className="mt-2 text-[11px] font-bold text-muted-foreground">Premio: {championFrame.name}</p>
          )}
        </div>

        <div className="rounded-2xl border-2 border-accent/60 bg-accent/10 p-4 text-center">
          <div className="relative mx-auto mb-3 h-24 w-20">
            <div className="absolute bottom-0 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-card text-4xl shadow-pop ring-4 ring-accent">
              {settings.showcase.team.emoji}
            </div>
          </div>
          <h3 className="text-base">{settings.showcase.team.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{settings.showcase.team.description}</p>
          {teamTitle && <p className="mt-2 text-[11px] font-bold text-muted-foreground">Titolo: {teamTitle.value}</p>}
        </div>

        <div className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-4 text-center">
          <div className="relative mx-auto mb-3 h-24 w-20">
            <div className="absolute bottom-0 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-card text-4xl shadow-pop ring-4 ring-primary">
              {streak.emoji}
            </div>
          </div>
          <h3 className="text-base">{streak.label}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{streak.description}</p>
          <p className="mt-2 text-[11px] font-bold text-muted-foreground">
            {streak.credits ? `🪙 ${streak.credits} crediti` : ""}
            {streakItem ? `${streak.credits ? " · " : ""}${streakItem.name}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
