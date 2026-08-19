import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { EMPTY_MISSIONS, type MissionId } from "./missions";

type ProfilePatch = Database["public"]["Tables"]["profiles"]["Update"];

export type ProfileRow = {
  id: string;
  nickname: string;
  avatar_id: string;
  frame_id: string;
  title_id: string;
  points: number;
  credits: number;
  day: string | null;
  free_used: number;
  bonus_unlocked: number;
  bonus_used: number;
  answered_quiz_ids: string[];
  team: "fulmini" | "comete" | null;
  team_week: string | null;
  wheel_spun_day: string | null;
  streak_days: number;
  missions: Record<MissionId, number>;
  claimed_missions: string[];
  chat_sent: number;
  active_quiz_id: string | null;
  active_quiz_started_at: string | null;
  streak_frozen: boolean;
  streak_prize_season: number;
};

export type GameSnapshot = {
  profile: ProfileRow;
  owned: string[];
  settings: AppSettings;
  isAdmin: boolean;
};

export const DEFAULT_ITEMS = ["av-fox", "fr-basic", "ti-novice"];

export function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function weekISO(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

const SELECT = "*";

function yesterdayISO(d = new Date()) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() - 1);
  return todayISO(x);
}

async function dailyReset(row: ProfileRow): Promise<ProfileRow> {
  const patch: ProfilePatch = {};
  let streakReached7 = false;

  if (row.day !== todayISO()) {
    // Streak: avanza solo se l'accesso precedente era ieri, altrimenti riparte da oggi.
    let streak: number;
    if (!row.day) {
      streak = 1;
    } else if (row.day === yesterdayISO()) {
      streak = Math.min(7, row.streak_days + 1);
    } else {
      streak = 1;
    }
    streakReached7 = streak >= 7;

    Object.assign(patch, {
      day: todayISO(),
      free_used: 0,
      bonus_unlocked: 0,
      bonus_used: 0,
      answered_quiz_ids: [],
      missions: EMPTY_MISSIONS,
      claimed_missions: [],
      chat_sent: 0,
      active_quiz_id: null,
      active_quiz_started_at: null,
      streak_days: streak,
      streak_frozen: false,
    });
  }
  if (row.team_week !== weekISO()) {
    Object.assign(patch, { team: null, team_week: null });
  }
  if (Object.keys(patch).length === 0) return row;
  let next = await patchProfile(row.id, patch);

  if (streakReached7) next = await grantStreakPrize(next);
  return next;
}


/** Consegna davvero il premio streak (crediti + oggetto) una sola volta per stagione. */
async function grantStreakPrize(row: ProfileRow): Promise<ProfileRow> {
  const settings = await getSettings();
  if (row.streak_prize_season >= settings.season.number) return row;

  const prize = settings.streakPrize;
  if (prize.itemId) await grantItem(row.id, prize.itemId);
  return await patchProfile(row.id, {
    credits: row.credits + (prize.credits ?? 0),
    streak_prize_season: settings.season.number,
  });
}


export async function patchProfile(userId: string, patch: ProfilePatch): Promise<ProfileRow> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as ProfileRow;
}

export async function getOwned(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from("inventory").select("item_id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.item_id as string);
}

export async function grantItem(userId: string, itemId: string) {
  await supabaseAdmin.from("inventory").upsert({ user_id: userId, item_id: itemId }, { onConflict: "user_id,item_id" });
}

export async function loadProfile(userId: string, fallbackNickname: string): Promise<ProfileRow> {
  const { data, error } = await supabaseAdmin.from("profiles").select(SELECT).eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);

  if (data) return await dailyReset(data as unknown as ProfileRow);

  const nickname = sanitizeNickname(fallbackNickname) || "Sfidante";
  const { data: created, error: insertError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId, nickname, day: todayISO(), streak_days: 1 })
    .select(SELECT)
    .single();
  if (insertError) throw new Error(insertError.message);

  await supabaseAdmin
    .from("inventory")
    .upsert(
      DEFAULT_ITEMS.map((item_id) => ({ user_id: userId, item_id })),
      { onConflict: "user_id,item_id" },
    );

  return created as unknown as ProfileRow;
}

export async function snapshot(userId: string, profile: ProfileRow): Promise<GameSnapshot> {
  const [owned, settings, admin] = await Promise.all([getOwned(userId), getSettings(), isAdmin(userId)]);
  return { profile, owned, settings, isAdmin: admin };
}

export function sanitizeNickname(raw: string) {
  return raw.replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 16);
}

/* ---------------- Impostazioni app (gestite dal pannello admin) ---------------- */

import { DEFAULT_SETTINGS, type AppSettings, type WheelPrize, type StreakPrize } from "./settings";
export type { WheelPrize, StreakPrize, ShowcaseEntry, AppSettings } from "./settings";
export { DEFAULT_SETTINGS } from "./settings";



export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabaseAdmin.from("app_settings").select("key, value");
  if (error) throw new Error(error.message);
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value as unknown]));
  return {
    wheelPrizes: (map.get("wheel_prizes") as WheelPrize[] | undefined) ?? DEFAULT_SETTINGS.wheelPrizes,
    streakPrize: (map.get("streak_prize") as StreakPrize | undefined) ?? DEFAULT_SETTINGS.streakPrize,
    showcase: (map.get("showcase") as AppSettings["showcase"] | undefined) ?? DEFAULT_SETTINGS.showcase,
    season: (map.get("season") as { number: number } | undefined) ?? DEFAULT_SETTINGS.season,
    teams: (map.get("teams") as AppSettings["teams"] | undefined) ?? DEFAULT_SETTINGS.teams,
    seasonPrizes: (map.get("season_prizes") as AppSettings["seasonPrizes"] | undefined) ?? DEFAULT_SETTINGS.seasonPrizes,
    customAssets: (map.get("custom_assets") as AppSettings["customAssets"] | undefined) ?? DEFAULT_SETTINGS.customAssets,
  };
}

export async function setSetting(key: string, value: unknown) {
  const { error } = await supabaseAdmin
    .from("app_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function assertAdmin(userId: string) {
  if (!(await isAdmin(userId))) throw new Error("Accesso riservato agli amministratori");
}

/* ---------------- Chat persistente ---------------- */

export type ChatRow = {
  id: string;
  user_id: string;
  nickname: string;
  avatar_id: string;
  frame_id: string;
  title_id: string;
  team: string | null;
  text: string;
  created_at: string;
};

export async function listChat(limit = 60): Promise<ChatRow[]> {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ChatRow[]).reverse();
}

export async function insertChat(row: Omit<ChatRow, "id" | "created_at">) {
  const { error } = await supabaseAdmin.from("chat_messages").insert(row as never);
  if (error) throw new Error(error.message);
}

export async function resetChat() {
  const { error } = await supabaseAdmin.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(error.message);
}

export async function resetStreaks() {
  const { error } = await supabaseAdmin.from("profiles").update({ streak_days: 0, streak_frozen: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(error.message);
}

export type SeasonAward = {
  championId: string | null;
  championNickname: string | null;
  championFrameId: string;
  winningTeam: "fulmini" | "comete" | null;
  teamTitleId: string;
  teamMembers: number;
};

/** Assegna davvero i premi di fine stagione prima dell'azzeramento dei punti. */
export async function awardSeasonPrizes(): Promise<SeasonAward> {
  const settings = await getSettings();
  const { championFrameId, teamTitleId } = settings.seasonPrizes;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, nickname, points, team")
    .order("points", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { id: string; nickname: string; points: number; team: string | null }[];

  const champion = rows.find((r) => r.points > 0) ?? null;
  if (champion && championFrameId) {
    await grantItem(champion.id, championFrameId);
    await patchProfile(champion.id, { frame_id: championFrameId });
  }

  const totals: Record<string, number> = { fulmini: 0, comete: 0 };
  for (const r of rows) if (r.team && r.team in totals) totals[r.team] = (totals[r.team] ?? 0) + r.points;

  let winningTeam: "fulmini" | "comete" | null = null;
  if (totals["fulmini"] !== totals["comete"]) {
    winningTeam = (totals["fulmini"] ?? 0) > (totals["comete"] ?? 0) ? "fulmini" : "comete";
  }

  let teamMembers = 0;
  if (winningTeam && teamTitleId) {
    const members = rows.filter((r) => r.team === winningTeam);
    teamMembers = members.length;
    for (const m of members) {
      await grantItem(m.id, teamTitleId);
      await patchProfile(m.id, { title_id: teamTitleId });
    }
  }

  return {
    championId: champion?.id ?? null,
    championNickname: champion?.nickname ?? null,
    championFrameId,
    winningTeam,
    teamTitleId,
    teamMembers,
  };
}

export async function startNewSeason(): Promise<{ season: number; award: SeasonAward }> {
  const settings = await getSettings();
  const next = settings.season.number + 1;

  const award = await awardSeasonPrizes();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ points: 0, streak_days: 0, streak_frozen: false, team: null, team_week: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(error.message);
  await setSetting("season", { number: next });
  await resetChat();
  return { season: next, award };
}
