import type { TeamId } from "./catalog";

export type Rival = {
  id: string;
  name: string;
  avatar: string;
  frameClass: string;
  title: string;
  team: TeamId;
  points: number;
};

export const RIVALS: Rival[] = [
  { id: "r1", name: "LunaTrap", avatar: "🦉", frameClass: "ring-4 ring-coin", title: "Leggenda", team: "fulmini", points: 412 },
  { id: "r2", name: "MrEnigma", avatar: "👾", frameClass: "ring-4 ring-accent", title: "Cervellone", team: "comete", points: 388 },
  { id: "r3", name: "Zoe99", avatar: "🦄", frameClass: "ring-4 ring-primary", title: "Anti-Trabocchetto", team: "comete", points: 350 },
  { id: "r4", name: "BitFox", avatar: "🦊", frameClass: "ring-2 ring-border", title: "Novellino", team: "fulmini", points: 305 },
  { id: "r5", name: "Draco", avatar: "🐲", frameClass: "ring-4 ring-coin", title: "Cervellone", team: "fulmini", points: 288 },
  { id: "r6", name: "RoboMind", avatar: "🤖", frameClass: "ring-4 ring-accent", title: "Novellino", team: "comete", points: 240 },
  { id: "r7", name: "Pippo", avatar: "🦊", frameClass: "ring-2 ring-border", title: "Novellino", team: "comete", points: 190 },
  { id: "r8", name: "Nina", avatar: "🦉", frameClass: "ring-4 ring-primary", title: "Anti-Trabocchetto", team: "fulmini", points: 155 },
];

/** Conteggio membri per squadra: usato per il bilanciamento 50/50. */
export function teamCounts() {
  return RIVALS.reduce(
    (acc, r) => {
      acc[r.team] += 1;
      return acc;
    },
    { fulmini: 0, comete: 0 } as Record<TeamId, number>,
  );
}

/** Squadra assegnata automaticamente da martedì a domenica (quella meno numerosa). */
export function assignedTeam(): TeamId {
  const c = teamCounts();
  return c.fulmini <= c.comete ? "fulmini" : "comete";
}

/** Lo scambio è possibile solo se non sbilancia le squadre oltre 1 membro di differenza. */
export function swapAllowed(): boolean {
  const c = teamCounts();
  return Math.abs(c.fulmini - c.comete) <= 1;
}
