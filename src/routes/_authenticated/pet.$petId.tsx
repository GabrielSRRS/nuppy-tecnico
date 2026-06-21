/* ============================================================================
 *  PÁGINA: /pet/$petId  —  DETALHE/EDIÇÃO DE UM PET
 * ----------------------------------------------------------------------------
 *  Mostra o perfil completo do pet (capa, badges de saúde, personalidade,
 *  notas médicas) e permite editar / excluir. Lê da tabela `pets` filtrando
 *  pelo ID na URL ($petId).
 * ========================================================================== */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ChevronLeft, MapPin, Cake, Scale, Heart, Stethoscope, Sparkles, Phone, Calendar, Palette, Ruler } from "lucide-react";
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

function ageFromBirthdate(d: string | null) {
  if (!d) return null;
  const b = new Date(d);
  const now = new Date();
  const years = now.getFullYear() - b.getFullYear() - (now < new Date(now.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
  if (years >= 1) return `${years} ${years === 1 ? "ano" : "anos"}`;
  const months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth();
  return `${months} ${months === 1 ? "mês" : "meses"}`;
}

function PetBody({ petId }: { petId: string }) {
  const { data: pet } = useSuspenseQuery(petQuery(petId));
  const age = pet.age ?? ageFromBirthdate(pet.birthdate) ?? "—";

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
      <div className="px-4 -mt-8 relative space-y-4 pb-8">
        <div className="nuppy-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-display text-3xl text-brand">{pet.name}</h1>
              <p className="text-sm text-muted-foreground">
                {pet.gender && <span>{pet.gender === "Macho" ? "♂ " : "♀ "}</span>}
                {pet.breed ?? pet.species}
                {pet.size && <span> · {pet.size}</span>}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {pet.vaccinated && <Badge>💉 Vacinado</Badge>}
              {pet.neutered && <Badge>✂️ Castrado</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <Info icon={<Cake className="size-4" />} label="Idade" value={age} />
            <Info icon={<Scale className="size-4" />} label="Peso" value={pet.weight ?? "—"} />
            <Info icon={<MapPin className="size-4" />} label="Cidade" value={pet.city ?? "—"} />
          </div>

          {(pet.color || pet.birthdate) && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pet.color && <Info icon={<Palette className="size-4" />} label="Cor" value={pet.color} />}
              {pet.birthdate && <Info icon={<Calendar className="size-4" />} label="Nascimento" value={new Date(pet.birthdate).toLocaleDateString("pt-BR")} />}
            </div>
          )}

          {pet.description && (
            <Block icon={<Sparkles className="size-4" />} title="Sobre">
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{pet.description}</p>
            </Block>
          )}

          {(pet.personality || pet.favorite_food || pet.favorite_toy) && (
            <Block icon={<Heart className="size-4" />} title="Personalidade & Gostos">
              {pet.personality && <p className="text-sm text-foreground/80">{pet.personality}</p>}
              {(pet.favorite_food || pet.favorite_toy) && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {pet.favorite_food && <Tag label="🍖 Comida" value={pet.favorite_food} />}
                  {pet.favorite_toy && <Tag label="🧸 Brinquedo" value={pet.favorite_toy} />}
                </div>
              )}
            </Block>
          )}

          {(pet.allergies || pet.medical_notes || pet.microchip || pet.vet_name) && (
            <Block icon={<Stethoscope className="size-4" />} title="Saúde">
              {pet.allergies && <Row label="Alergias" value={pet.allergies} />}
              {pet.medical_notes && <Row label="Observações" value={pet.medical_notes} />}
              {pet.microchip && <Row label="Microchip" value={pet.microchip} />}
              {pet.vet_name && (
                <Row
                  label="Veterinário"
                  value={
                    <span className="flex items-center gap-2">
                      {pet.vet_name}
                      {pet.vet_phone && (
                        <a href={`tel:${pet.vet_phone}`} className="inline-flex items-center gap-1 text-primary">
                          <Phone className="size-3" /> {pet.vet_phone}
                        </a>
                      )}
                    </span>
                  }
                />
              )}
            </Block>
          )}

          {pet.adopted_at && (
            <Block icon={<Ruler className="size-4" />} title="Marcos">
              <Row label="Chegada em casa" value={new Date(pet.adopted_at).toLocaleDateString("pt-BR")} />
            </Block>
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

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-primary/15 text-primary text-[10px] font-display px-2 py-0.5 whitespace-nowrap">{children}</span>;
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

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-display text-brand mb-1 flex items-center gap-1 text-sm uppercase tracking-wide">
        <span className="text-primary">{icon}</span>{title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground/90">{value}</span>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-accent/50 p-2">
      <p className="text-[10px] font-display text-brand">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
