import type { TeamId } from "./catalog";

export type TeamCounts = Record<TeamId, number>;

export const EMPTY_COUNTS: TeamCounts = { fulmini: 0, comete: 0 };

/** Squadra proposta automaticamente (da martedì a domenica): quella meno numerosa. */
export function assignedTeamFrom(counts: TeamCounts): TeamId {
  return counts.fulmini <= counts.comete ? "fulmini" : "comete";
}

/**
 * Bilanciamento ibrido: il cambio è consentito solo se, simulando lo spostamento,
 * la differenza assoluta è <= 5 oppure <= 15% del totale degli utenti nelle due squadre.
 */
export function swapAllowedFrom(counts: TeamCounts, from: TeamId, to: TeamId): boolean {
  if (from === to) return true;
  const simulated: TeamCounts = { ...counts, [from]: counts[from] - 1, [to]: counts[to] + 1 };
  const diff = Math.abs(simulated.fulmini - simulated.comete);
  const total = simulated.fulmini + simulated.comete;
  return diff <= 5 || diff <= total * 0.15;
}
