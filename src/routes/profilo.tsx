import { createFileRoute } from "@tanstack/react-router";
import { PlayerChip } from "@/components/PlayerChip";
import { Button } from "@/components/ui/button";
import { AVATARS, FRAMES, TITLES } from "@/lib/game/catalog";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profilo")({
  head: () => ({
    meta: [
      { title: "Profilo — Quiz Squad" },
      { name: "description", content: "La tua collezione: avatar, cornici e titoli sbloccati." },
      { property: "og:title", content: "Profilo — Quiz Squad" },
      { property: "og:description", content: "Gestisci avatar, cornici e titoli collezionati." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { state, avatar, frameClass, title, equip, hydrated } = useGame();

  return (
    <div className="space-y-6">
      <section className="card-fun p-5">
        <PlayerChip
          name={hydrated ? state.nickname : "…"}
          avatar={avatar}
          frameClass={frameClass}
          title={title}
          team={state.team}
          size="lg"
        />
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Box label="Punti" value={hydrated ? state.points : 0} />
          <Box label="Crediti" value={hydrated ? state.credits : 0} />
          <Box label="Quiz svolti" value={hydrated ? state.answeredQuizIds.length : 0} />
        </div>
      </section>

      <Collection title="Avatar" items={AVATARS} owned={state.owned} current={state.avatarId} onEquip={equip} render={(v) => <span className="text-3xl">{v}</span>} />
      <Collection
        title="Cornici"
        items={FRAMES}
        owned={state.owned}
        current={state.frameId}
        onEquip={equip}
        render={(v) => <span className={cn("grid h-12 w-12 place-items-center rounded-full bg-muted text-xl", v)}>🙂</span>}
      />
      <Collection
        title="Titoli"
        items={TITLES}
        owned={state.owned}
        current={state.titleId}
        onEquip={equip}
        render={(v) => <span className="text-sm font-bold">{v}</span>}
      />
    </div>
  );
}

function Box({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Collection({
  title,
  items,
  owned,
  current,
  onEquip,
  render,
}: {
  title: string;
  items: { id: string; name: string; value: string; price: number }[];
  owned: string[];
  current: string;
  onEquip: (id: string) => void;
  render: (value: string) => React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const has = owned.includes(item.id);
          return (
            <div
              key={item.id}
              className={cn("card-fun flex flex-col items-center gap-2 p-4 text-center", !has && "opacity-60")}
            >
              <div className="grid h-14 place-items-center">{render(item.value)}</div>
              <p className="text-sm font-bold">{item.name}</p>
              {has ? (
                current === item.id ? (
                  <span className="rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">
                    In uso
                  </span>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={() => onEquip(item.id)}>
                    Equipaggia
                  </Button>
                )
              ) : (
                <span className="text-xs text-muted-foreground">
                  {item.price < 0 ? "Premio stagionale 🔒" : "Non posseduto"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
