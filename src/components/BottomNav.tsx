import { Link, useRouterState } from "@tanstack/react-router";
import { PawPrint, Heart, MapPin, User } from "lucide-react";

const items = [
  { to: "/home", label: "Início", icon: PawPrint, color: "text-primary" },
  { to: "/social", label: "Social", icon: Heart, color: "text-love" },
  { to: "/local", label: "Local", icon: MapPin, color: "text-brand-soft" },
  { to: "/perfil", label: "Perfil", icon: User, color: "text-brand" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3">
      <div className="flex items-center justify-between gap-2 rounded-3xl bg-card/95 backdrop-blur border border-border shadow-[0_-6px_24px_-12px_rgba(180,120,40,0.35)] p-2">
        {items.map(({ to, label, icon: Icon, color }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition " +
                (active ? "bg-primary/15" : "hover:bg-accent/50")
              }
            >
              <Icon className={(active ? color : "text-muted-foreground") + " size-5"} strokeWidth={2.2} />
              <span className={"text-[11px] font-display " + (active ? "text-brand" : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
