export function PrizeShowcase() {
  return (
    <section className="card-fun overflow-hidden">
      <div className="bg-fun-gradient px-5 py-4">
        <h2 className="text-xl text-primary-foreground">🏆 Vetrina dei Premi</h2>
        <p className="text-xs text-primary-foreground/85">In palio a fine stagione</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-coin/60 bg-coin/10 p-4 text-center">
          <div className="relative mx-auto mb-3 h-24 w-20">
            <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-2xl drop-shadow-sm" aria-hidden="true">
              👑
            </span>
            <div className="absolute bottom-0 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-card text-4xl shadow-pop ring-4 ring-coin">
              🦊
            </div>
          </div>
          <h3 className="text-base">Premio Campione</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Cornice con corona per il 1° della classifica generale.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-accent/60 bg-accent/10 p-4 text-center">
          <div className="relative mx-auto mb-3 h-24 w-20">
            <div className="absolute bottom-0 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-card text-4xl shadow-pop ring-4 ring-accent">
              🎖️
            </div>
          </div>
          <h3 className="text-base">Premio Squadra</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Titolo "Squadra Campione" per tutti i membri della squadra vincitrice.
          </p>
        </div>
      </div>
    </section>
  );
}
