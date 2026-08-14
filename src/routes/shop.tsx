import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AVATARS, FRAMES, TITLES, NICKNAME_TOKEN, type ShopItem } from "@/lib/game/catalog";
import { useGame } from "@/lib/game/store";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Quiz Squad" },
      { name: "description", content: "Spendi i crediti in avatar, cornici, titoli e cambio nickname." },
      { property: "og:title", content: "Shop — Quiz Squad" },
      { property: "og:description", content: "Personalizza il tuo profilo con avatar, cornici e titoli." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { state, buy, hydrated, setNickname } = useGame();
  const [nick, setNick] = useState("");

  async function handleBuy(item: ShopItem) {
    try {
      await buy(item.id);
      toast.success(`${item.name} acquistato ed equipaggiato!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Acquisto non riuscito");
    }
  }

  async function handleNickname() {
    if (nick.trim().length < 3) {
      toast.error("Il nickname deve avere almeno 3 caratteri.");
      return;
    }
    try {
      await setNickname(nick);
      setNick("");
      toast.success("Nickname aggiornato!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cambio nickname non riuscito");
    }
  }

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl">Shop</h1>
          <p className="text-sm text-muted-foreground">Personalizza il tuo profilo con i crediti.</p>
        </div>
        <span className="shrink-0 rounded-full bg-coin px-4 py-2 font-bold text-coin-foreground">
          🪙 {hydrated ? state.credits : 0}
        </span>
      </header>

      <Tabs defaultValue="avatar">
        <TabsList className="w-full">
          <TabsTrigger value="avatar" className="flex-1">Avatar</TabsTrigger>
          <TabsTrigger value="frame" className="flex-1">Cornici</TabsTrigger>
          <TabsTrigger value="title" className="flex-1">Titoli</TabsTrigger>
          <TabsTrigger value="nick" className="flex-1">Nickname</TabsTrigger>
        </TabsList>

        <TabsContent value="avatar" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AVATARS.map((item) => (
            <ItemCard key={item.id} item={item} preview={<span className="text-4xl">{item.value}</span>} onBuy={handleBuy} />
          ))}
        </TabsContent>

        <TabsContent value="frame" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMES.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              preview={
                <span className={cn("grid h-14 w-14 place-items-center rounded-full bg-muted text-2xl", item.value)}>
                  🙂
                </span>
              }
              onBuy={handleBuy}
            />
          ))}
        </TabsContent>

        <TabsContent value="title" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TITLES.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              preview={<span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{item.value}</span>}
              onBuy={handleBuy}
            />
          ))}
        </TabsContent>

        <TabsContent value="nick" className="mt-4">
          <div className="card-fun space-y-3 p-5">
            <h3 className="text-lg">Cambio nickname</h3>
            <p className="text-sm text-muted-foreground">Costo: 🪙 {NICKNAME_TOKEN.price} crediti · 3-16 caratteri.</p>
            <Input
              value={nick}
              maxLength={16}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Nuovo nickname"
              className="rounded-xl"
            />
            <Button className="rounded-xl font-bold" onClick={handleNickname}>
              Acquista e applica
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ItemCard({
  item,
  preview,
  onBuy,
}: {
  item: ShopItem;
  preview: React.ReactNode;
  onBuy: (i: ShopItem) => void;
}) {
  const { state, equip, hydrated } = useGame();
  const owned = hydrated && state.owned.includes(item.id);
  const locked = item.price < 0;

  return (
    <div className="card-fun flex flex-col items-center gap-3 p-5 text-center">
      <div className="grid h-16 place-items-center">{preview}</div>
      <h3 className="text-base">{item.name}</h3>
      {locked ? (
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
          Premio di fine stagione 🔒
        </span>
      ) : owned ? (
        <Button variant="outline" className="w-full rounded-xl font-bold" onClick={() => equip(item.id)}>
          Equipaggia
        </Button>
      ) : (
        <Button className="w-full rounded-xl font-bold" onClick={() => onBuy(item)}>
          🪙 {item.price}
        </Button>
      )}
    </div>
  );
}
