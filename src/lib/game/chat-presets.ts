export const CHAT_PRESETS = [
  "Ciao squadra! 👋",
  "Forza ragazzi! 💪",
  "Che trabocchetto assurdo!",
  "Ce l'ho fatta! 🎉",
  "Serve aiuto qui 🙃",
  "Buona fortuna a tutti!",
] as const;

export const CHAT_STICKERS = ["🔥", "🎉", "🤯", "😂", "👏", "🧠", "⚡", "☄️"] as const;

export const ALLOWED_CHAT_MESSAGES: string[] = [...CHAT_PRESETS, ...CHAT_STICKERS];

export function isAllowedChatMessage(text: string) {
  return ALLOWED_CHAT_MESSAGES.includes(text);
}
