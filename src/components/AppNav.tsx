import { Link } from "@tanstack/react-router";
import { Home, ShoppingBag, Target, MessageCircle, User, Trophy, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useGame } from "@/lib/game/store";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/missioni", label: "Missioni", icon: Target },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/classifica", label: "Classifica", icon: Trophy },
  { to: "/profilo", label: "Profilo", icon: User },
] as const;

export function AppNav() {
  const { theme, toggle } = useTheme();
  const { state, hydrated, user, signOut } = useGame();

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-hero-gradient text-lg shadow-soft">
              🧠
            </span>
            <span className="truncate font-display text-xl font-extrabold text-gradient-fun">Quiz Squad</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-coin px-3 py-1 text-xs font-bold text-coin-foreground">
              🪙 {hydrated ? state.credits : 0}
            </span>
            <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground sm:inline">
              ⭐ {hydrated ? state.points : 0}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={toggle}
              aria-label="Cambia tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() => void signOut()}
                aria-label="Esci"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 pb-2 md:flex">
          {ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-border bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold text-muted-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
