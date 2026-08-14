export type ShopItem = {
  id: string;
  kind: "avatar" | "frame" | "title" | "nickname";
  name: string;
  price: number;
  value: string;
};

export const AVATARS: ShopItem[] = [
  { id: "av-fox", kind: "avatar", name: "Volpe furba", price: 0, value: "🦊" },
  { id: "av-owl", kind: "avatar", name: "Gufo saggio", price: 40, value: "🦉" },
  { id: "av-alien", kind: "avatar", name: "Alieno curioso", price: 60, value: "👾" },
  { id: "av-dragon", kind: "avatar", name: "Draghetto", price: 90, value: "🐲" },
  { id: "av-robot", kind: "avatar", name: "Robo-Quiz", price: 120, value: "🤖" },
  { id: "av-unicorn", kind: "avatar", name: "Unicorno", price: 150, value: "🦄" },
];

export const FRAMES: ShopItem[] = [
  { id: "fr-basic", kind: "frame", name: "Cornice base", price: 0, value: "ring-2 ring-border" },
  { id: "fr-mint", kind: "frame", name: "Cornice menta", price: 50, value: "ring-4 ring-accent" },
  { id: "fr-flame", kind: "frame", name: "Cornice fiamma", price: 80, value: "ring-4 ring-primary" },
  { id: "fr-gold", kind: "frame", name: "Cornice oro", price: 140, value: "ring-4 ring-coin" },
  {
    id: "fr-champion",
    kind: "frame",
    name: "Cornice Campione 👑",
    price: -1,
    value: "ring-4 ring-coin shadow-pop",
  },
];

export const TITLES: ShopItem[] = [
  { id: "ti-novice", kind: "title", name: "Novellino", price: 0, value: "Novellino" },
  { id: "ti-brain", kind: "title", name: "Cervellone", price: 45, value: "Cervellone" },
  { id: "ti-trap", kind: "title", name: "Anti-Trabocchetto", price: 75, value: "Anti-Trabocchetto" },
  { id: "ti-legend", kind: "title", name: "Leggenda", price: 160, value: "Leggenda" },
  { id: "ti-season", kind: "title", name: "Squadra Campione 🏆", price: -1, value: "Squadra Campione" },
];

export const NICKNAME_TOKEN: ShopItem = {
  id: "nk-token",
  kind: "nickname",
  name: "Cambio nickname",
  price: 100,
  value: "nickname",
};

export const ALL_ITEMS: ShopItem[] = [...AVATARS, ...FRAMES, ...TITLES, NICKNAME_TOKEN];

export function findItem(id: string) {
  return ALL_ITEMS.find((i) => i.id === id);
}

export type TeamId = "fulmini" | "comete";

export const TEAMS: Record<TeamId, { id: TeamId; name: string; emoji: string; colorClass: string }> = {
  fulmini: { id: "fulmini", name: "Fulmini", emoji: "⚡", colorClass: "bg-team-a" },
  comete: { id: "comete", name: "Comete", emoji: "☄️", colorClass: "bg-team-b" },
};
