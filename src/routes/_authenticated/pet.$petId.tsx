/* ============================================================================
 *  PÁGINA: /pet/$petId  —  DETALHE DO PET
 * ----------------------------------------------------------------------------
 *  Layout em blocos claros:
 *    1) HERO: foto grande + botão voltar + badges flutuantes
 *    2) IDENTIDADE: nome, raça, sexo, porte + status (vacinado/castrado)
 *    3) DADOS RÁPIDOS: 4 cards (idade, peso, cor, cidade)
 *    4) SOBRE: descrição/bio
 *    5) PERSONALIDADE & GOSTOS: chips + tags
 *    6) SAÚDE: alergias, notas, microchip, veterinário
 *    7) MARCOS: adoção, nascimento
 *    8) TUTOR: card no rodapé
 * ========================================================================== */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  ChevronLeft, MapPin, Cake, Scale, Heart, Stethoscope, Sparkles,
  Phone, Calendar, Palette, ShieldCheck, Syringe, Scissors, Fingerprint,
  AlertTriangle, User, Home,
} from "lucide-react";
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
      {/* ============= 1) HERO ============= */}
      <div className="relative">
        <div className="h-80 bg-muted overflow-hidden">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-8xl bg-gradient-to-br from-secondary to-accent">🐾</div>
          )}
          {/* gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <Link to="/perfil" className="absolute top-4 left-4 size-10 grid place-items-center rounded-full bg-card/90 backdrop-blur shadow-card">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        {/* Badges flutuantes de saúde */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5">
          {pet.vaccinated && <FloatBadge icon={<Syringe className="size-3" />} label="Vacinado" />}
          {pet.neutered && <FloatBadge icon={<Scissors className="size-3" />} label="Castrado" />}
        </div>
      </div>

      <div className="px-4 -mt-16 relative space-y-4 pb-10">
        {/* ============= 2) IDENTIDADE ============= */}
        <section className="nuppy-card-float p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-3xl text-brand leading-tight">{pet.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pet.gender && <span className="mr-1">{pet.gender === "Macho" ? "♂" : "♀"}</span>}
                {pet.breed ?? pet.species}
                {pet.size && <span> · {pet.size}</span>}
              </p>
              {/* chips de espécie */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Chip>{pet.species}</Chip>
                {pet.gender && <Chip>{pet.gender}</Chip>}
                {pet.size && <Chip>Porte {pet.size}</Chip>}
              </div>
            </div>
          </div>
        </section>

        {/* ============= 3) DADOS RÁPIDOS ============= */}
        <section className="grid grid-cols-2 gap-2">
          <QuickInfo icon={<Cake className="size-4" />} label="Idade" value={age} />
          <QuickInfo icon={<Scale className="size-4" />} label="Peso" value={pet.weight ?? "—"} />
          <QuickInfo icon={<Palette className="size-4" />} label="Cor" value={pet.color ?? "—"} />
          <QuickInfo icon={<MapPin className="size-4" />} label="Cidade" value={pet.city ?? "—"} />
        </section>

        {/* ============= 4) SOBRE ============= */}
        {pet.description && (
          <SectionCard icon={<Sparkles className="size-4" />} title="Sobre">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{pet.description}</p>
          </SectionCard>
        )}

        {/* ============= 5) PERSONALIDADE & GOSTOS ============= */}
        {(pet.personality || pet.favorite_food || pet.favorite_toy) && (
          <SectionCard icon={<Heart className="size-4" />} title="Personalidade & Gostos">
            {pet.personality && <p className="text-sm text-foreground/80 mb-3">{pet.personality}</p>}
            {(pet.favorite_food || pet.favorite_toy) && (
              <div className="grid grid-cols-2 gap-2">
                {pet.favorite_food && <FavTag emoji="🍖" label="Comida" value={pet.favorite_food} />}
                {pet.favorite_toy && <FavTag emoji="🧸" label="Brinquedo" value={pet.favorite_toy} />}
              </div>
            )}
          </SectionCard>
        )}

        {/* ============= 6) SAÚDE ============= */}
        {(pet.allergies || pet.medical_notes || pet.microchip || pet.vet_name || pet.vaccinated || pet.neutered) && (
          <SectionCard icon={<Stethoscope className="size-4" />} title="Saúde">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <HealthBadge active={!!pet.vaccinated} icon={<Syringe className="size-3" />} label="Vacinado" />
              <HealthBadge active={!!pet.neutered} icon={<Scissors className="size-3" />} label="Castrado" />
              <HealthBadge active={!!pet.microchip} icon={<Fingerprint className="size-3" />} label="Chip" />
            </div>
            {pet.allergies && (
              <HealthRow icon={<AlertTriangle className="size-4 text-orange-500" />} label="Alergias" value={pet.allergies} />
            )}
            {pet.medical_notes && (
              <HealthRow icon={<ShieldCheck className="size-4 text-primary" />} label="Observações" value={pet.medical_notes} />
            )}
            {pet.microchip && (
              <HealthRow icon={<Fingerprint className="size-4 text-primary" />} label="Microchip" value={<span className="font-mono">{pet.microchip}</span>} />
            )}
            {pet.vet_name && (
              <HealthRow
                icon={<Stethoscope className="size-4 text-primary" />}
                label="Veterinário"
                value={
                  <span className="flex items-center gap-2 flex-wrap">
                    {pet.vet_name}
                    {pet.vet_phone && (
                      <a href={`tel:${pet.vet_phone}`} className="inline-flex items-center gap-1 text-primary underline">
                        <Phone className="size-3" /> {pet.vet_phone}
                      </a>
                    )}
                  </span>
                }
              />
            )}
          </SectionCard>
        )}

        {/* ============= 7) MARCOS ============= */}
        {(pet.birthdate || pet.adopted_at) && (
          <SectionCard icon={<Calendar className="size-4" />} title="Marcos">
            {pet.birthdate && (
              <HealthRow icon={<Cake className="size-4 text-primary" />} label="Nascimento" value={new Date(pet.birthdate).toLocaleDateString("pt-BR")} />
            )}
            {pet.adopted_at && (
              <HealthRow icon={<Home className="size-4 text-primary" />} label="Chegada em casa" value={new Date(pet.adopted_at).toLocaleDateString("pt-BR")} />
            )}
          </SectionCard>
        )}

        {/* ============= 8) TUTOR ============= */}
        <section className="nuppy-card p-4 flex items-center gap-3">
          <div className="size-12 rounded-full bg-muted overflow-hidden grid place-items-center border-2 border-card shadow-soft">
            {pet.profile?.avatar_url ? (
              <img src={pet.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : <User className="size-5 text-muted-foreground" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tutor</p>
            <p className="font-display text-sm text-brand truncate">{pet.profile?.display_name ?? pet.profile?.username}</p>
            <p className="text-xs text-muted-foreground truncate">@{pet.profile?.username}</p>
          </div>
        </section>
      </div>
    </>
  );
}

/* ---------- pequenos componentes visuais ---------- */

function FloatBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="rounded-full bg-card/95 backdrop-blur px-2.5 py-1 text-[11px] font-display text-brand shadow-soft inline-flex items-center gap-1">
      {icon} {label}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="nuppy-chip text-[11px]">{children}</span>;
}

function QuickInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="nuppy-card p-3">
      <div className="flex items-center gap-1.5 text-primary mb-1">{icon}<span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span></div>
      <p className="font-display text-brand text-base leading-tight">{value}</p>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="nuppy-card p-4">
      <h3 className="font-display text-brand text-sm uppercase tracking-wide flex items-center gap-1.5 mb-3">
        <span className="text-primary">{icon}</span>{title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function HealthBadge({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-display inline-flex items-center gap-1 ${
      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground line-through"
    }`}>
      {icon} {label}
    </span>
  );
}

function HealthRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm py-1">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-foreground/90">{value}</div>
      </div>
    </div>
  );
}

function FavTag({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-accent/40 border border-border p-2.5">
      <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wide">{emoji} {label}</p>
      <p className="text-sm text-brand font-display">{value}</p>
    </div>
  );
}
