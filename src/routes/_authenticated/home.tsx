import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Mic, Heart, MapPin } from "lucide-react";
import { Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NuppyLogo } from "@/components/NuppyLogo";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Início — Nuppy" }] }),
  component: HomePage,
});

const categories = [
  { label: "Adoção", emoji: "🐾", bg: "from-pink-200 to-orange-100" },
  { label: "Veterinário", emoji: "🩺", bg: "from-amber-200 to-orange-100" },
  { label: "Pet Shop", emoji: "🛍️", bg: "from-sky-200 to-amber-100" },
] as const;

function HomePage() {
  return (
    <MobileShell>
      <header className="relative pt-4 pb-2 px-4">
        <div className="flex justify-center">
          <NuppyLogo className="h-32 drop-shadow-sm" />
        </div>
        <div className="-mt-6 flex justify-center">
          <span className="rounded-full bg-primary text-primary-foreground text-xs font-display px-4 py-1.5 shadow-soft">
            Onde todo animal encontra cuidado.
          </span>
        </div>
      </header>

      <div className="px-4 mt-4">
        <label className="relative block">
          <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Buscar..." className="w-full rounded-full bg-card border border-border pl-11 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <button className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-primary grid place-items-center text-primary-foreground">
            <Mic className="size-4" />
          </button>
        </label>
      </div>

      <section className="px-4 mt-6">
        <h2 className="font-display text-lg text-brand mb-2">Destaque</h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <button key={c.label} className={`rounded-2xl bg-gradient-to-br ${c.bg} aspect-square flex flex-col items-end p-2 shadow-card hover:scale-[1.02] transition`}>
              <span className="text-3xl ml-auto">{c.emoji}</span>
              <span className="mt-auto font-display text-sm text-brand">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 mt-6">
        <div className="nuppy-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐾</span>
              <h2 className="font-display text-lg text-brand">Adoção de Pets</h2>
            </div>
            <Link to="/social" className="text-sm font-display text-primary">Ver tudo →</Link>
          </div>
          <Suspense fallback={<div className="h-40 mt-3 grid grid-cols-2 gap-3"><Skel /><Skel /></div>}>
            <PetsForAdoption />
          </Suspense>
        </div>
      </section>
    </MobileShell>
  );
}

function Skel() { return <div className="rounded-2xl bg-muted animate-pulse" />; }

const adoptionQuery = {
  queryKey: ["adoption-pets"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("pets")
      .select("id, name, age, city, photo_url")
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return data ?? [];
  },
};

function PetsForAdoption() {
  const { data } = useSuspenseQuery(adoptionQuery);
  if (data.length === 0) {
    return (
      <div className="mt-3 rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">
        Nenhum pet cadastrado ainda. <Link to="/perfil" className="text-primary font-display">Cadastre o seu →</Link>
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {data.slice(0, 2).map((pet) => (
        <Link key={pet.id} to="/pet/$petId" params={{ petId: pet.id }} className="rounded-2xl bg-accent p-2 relative block">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full grid place-items-center text-4xl">🐶</div>
            )}
          </div>
          <Heart className="size-5 absolute top-3 right-3 text-love fill-love" />
          <div className="mt-2 px-1">
            <p className="font-display text-brand">{pet.name}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-between">
              <span>{pet.age ?? "—"}</span>
              {pet.city && <span className="flex items-center gap-1"><MapPin className="size-3" />{pet.city}</span>}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
