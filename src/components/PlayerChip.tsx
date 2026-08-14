import { cn } from "@/lib/utils";
import { TEAMS, type TeamId } from "@/lib/game/catalog";

type Props = {
  name: string;
  avatar: string;
  frameClass: string;
  title: string;
  team: TeamId | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function PlayerChip({ name, avatar, frameClass, title, team, size = "md", className }: Props) {
  const dim = size === "lg" ? "h-16 w-16 text-3xl" : size === "sm" ? "h-9 w-9 text-lg" : "h-12 w-12 text-2xl";
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-muted",
          dim,
          frameClass,
        )}
        aria-hidden
      >
        {avatar}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-display text-base font-extrabold">{name}</span>
          {team && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-primary-foreground",
                TEAMS[team].colorClass,
              )}
            >
              {TEAMS[team].emoji} {TEAMS[team].name}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
