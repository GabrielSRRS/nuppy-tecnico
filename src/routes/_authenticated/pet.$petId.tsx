import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ChevronLeft, MapPin, Cake, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/pet/$petId")({
  head: () => ({ meta: [{ title: "Pet — Nuppy" }] }),
  component: PetPage,
});

function petQuery(petId: string) {
  return {
    queryKey: ["pet", petId],
    queryFn: async () => {
      const { data: pet, error } = await supabase
        .from("pets").select("*").eq("id", petId).maybeSingle();
      if (error) throw error;
      if (!pet) throw notFound();
      const { data: profile } = await supabase
        .from("profiles").select("username, display_name, avatar_url")
        .eq("id", pet.owner_id).maybeSingle();
      return { ...pet, profile };
    },
  };
}

function PetPage() {
  const { petId } = Route.useParams();
  return (
    <MobileShell>
      <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Carregando...</div>}>
        <PetBody petId={petId} />
      </Suspense>
    </MobileShell>
  );
}

function PetBody({ petId }: { petId: string }) {
  const { data: pet } = useSuspenseQuery(petQuery(petId));
  return (
    <>
      <div className="relative">
        <div className="h-72 bg-muted overflow-hidden">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-7xl">🐾</div>
          )}
        </div>
        <Link to="/home" className="absolute top-4 left-4 size-10 grid place-items-center rounded-full bg-card/90 backdrop-blur shadow-card">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
      </div>
      <div className="px-4 -mt-8 relative">
        <div className="nuppy-card p-5">
          <h1 className="font-display text-3xl text-brand">{pet.name}</h1>
          <p className="text-sm text-muted-foreground">{pet.breed ?? pet.species}</p>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <Info icon={<Cake className="size-4" />} label="Idade" value={pet.age ?? "—"} />
            <Info icon={<Scale className="size-4" />} label="Peso" value={pet.weight ?? "—"} />
            <Info icon={<MapPin className="size-4" />} label="Cidade" value={pet.city ?? "—"} />
          </div>

          {pet.description && (
            <div className="mt-4">
              <h3 className="font-display text-brand mb-1">Sobre</h3>
              <p className="text-sm text-foreground/80">{pet.description}</p>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3 pt-4 border-t border-border">
            <div className="size-10 rounded-full bg-muted overflow-hidden grid place-items-center">
              {pet.profile?.avatar_url ? (
                <img src={pet.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : "👤"}
            </div>
            <div>
              <p className="font-display text-sm text-brand">Tutor</p>
              <p className="text-sm text-muted-foreground">@{pet.profile?.username}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <div className="flex justify-center text-primary mb-1">{icon}</div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-sm text-brand">{value}</p>
    </div>
  );
}
