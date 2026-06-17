import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MapPin } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/local")({
  head: () => ({ meta: [{ title: "Locais — Nuppy" }] }),
  component: LocalPage,
});

function LocalPage() {
  return (
    <MobileShell>
      <header className="px-4 pt-4 flex items-center gap-3">
        <Link to="/home" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-xl text-brand">Localização</h1>
      </header>
      <div className="p-6">
        <div className="nuppy-card p-8 text-center">
          <MapPin className="size-12 text-primary mx-auto" />
          <h2 className="font-display text-xl text-brand mt-3">Mapa Pet Friendly</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Em breve: veterinários, pet shops, parques e hotéis pet friendly perto de você no Google Maps. 🗺️
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
