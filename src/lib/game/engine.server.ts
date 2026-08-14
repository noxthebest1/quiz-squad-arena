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
};

export type GameSnapshot = { profile: ProfileRow; owned: string[] };

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

async function dailyReset(row: ProfileRow): Promise<ProfileRow> {
  const patch: ProfilePatch = {};
  if (row.day !== todayISO()) {
    Object.assign(patch, {
      day: todayISO(),
      free_used: 0,
      bonus_unlocked: 0,
      bonus_used: 0,
      answered_quiz_ids: [],
      missions: EMPTY_MISSIONS,
      claimed_missions: [],
      chat_sent: 0,
      streak_days: row.day ? Math.min(7, row.streak_days + 1) : 1,
    });
  }
  if (row.team_week !== weekISO()) {
    Object.assign(patch, { team: null, team_week: null });
  }
  if (Object.keys(patch).length === 0) return row;
  return await patchProfile(row.id, patch);
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
  return { profile, owned: await getOwned(userId) };
}

export function sanitizeNickname(raw: string) {
  return raw.replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 16);
}

/* ---------------- Impostazioni app (gestite dal pannello admin) ---------------- */

export type WheelPrize = { label: string; credits: number };
export type StreakPrize = { emoji: string; label: string; description: string };
export type ShowcaseEntry = { emoji: string; title: string; description: string };
export type AppSettings = {
  wheelPrizes: WheelPrize[];
  streakPrize: StreakPrize;
  showcase: { champion: ShowcaseEntry; team: ShowcaseEntry };
  season: { number: number };
};

export const DEFAULT_SETTINGS: AppSettings = {
  wheelPrizes: [
    { label: "5 crediti", credits: 5 },
    { label: "10 crediti", credits: 10 },
    { label: "15 crediti", credits: 15 },
    { label: "20 crediti", credits: 20 },
    { label: "30 crediti", credits: 30 },
    { label: "50 crediti", credits: 50 },
  ],
  streakPrize: {
    emoji: "🎁",
    label: "Baule Leggendario",
    description: "100 crediti + cornice esclusiva al 7° giorno di fila",
  },
  showcase: {
    champion: {
      emoji: "🦊",
      title: "Premio Campione",
      description: "Cornice con corona per il 1° della classifica generale.",
    },
    team: {
      emoji: "🎖️",
      title: "Premio Squadra",
      description: "Titolo Squadra Campione per tutti i membri della squadra vincitrice.",
    },
  },
  season: { number: 1 },
};

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabaseAdmin.from("app_settings").select("key, value");
  if (error) throw new Error(error.message);
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value as unknown]));
  return {
    wheelPrizes: (map.get("wheel_prizes") as WheelPrize[] | undefined) ?? DEFAULT_SETTINGS.wheelPrizes,
    streakPrize: (map.get("streak_prize") as StreakPrize | undefined) ?? DEFAULT_SETTINGS.streakPrize,
    showcase: (map.get("showcase") as AppSettings["showcase"] | undefined) ?? DEFAULT_SETTINGS.showcase,
    season: (map.get("season") as { number: number } | undefined) ?? DEFAULT_SETTINGS.season,
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
