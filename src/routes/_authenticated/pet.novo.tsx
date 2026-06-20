import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pet/novo")({
  head: () => ({ meta: [{ title: "Novo Pet — Nuppy" }] }),
  component: NovoPet,
});

type Form = {
  name: string;
  species: string;
  breed: string;
  gender: string;
  birthdate: string;
  age: string;
  weight: string;
  size: string;
  color: string;
  photo_url: string;
  city: string;
  description: string;
  personality: string;
  favorite_food: string;
  favorite_toy: string;
  neutered: boolean;
  vaccinated: boolean;
  microchip: string;
  allergies: string;
  medical_notes: string;
  adopted_at: string;
  vet_name: string;
  vet_phone: string;
};

const empty: Form = {
  name: "", species: "Cachorro", breed: "", gender: "", birthdate: "", age: "", weight: "",
  size: "", color: "", photo_url: "", city: "", description: "", personality: "",
  favorite_food: "", favorite_toy: "", neutered: false, vaccinated: false,
  microchip: "", allergies: "", medical_notes: "", adopted_at: "", vet_name: "", vet_phone: "",
};

function NovoPet() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const payload = {
        owner_id: user.id,
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        gender: form.gender || null,
        birthdate: form.birthdate || null,
        age: form.age || null,
        weight: form.weight || null,
        size: form.size || null,
        color: form.color || null,
        photo_url: form.photo_url || null,
        city: form.city || null,
        description: form.description || null,
        personality: form.personality || null,
        favorite_food: form.favorite_food || null,
        favorite_toy: form.favorite_toy || null,
        neutered: form.neutered,
        vaccinated: form.vaccinated,
        microchip: form.microchip || null,
        allergies: form.allergies || null,
        medical_notes: form.medical_notes || null,
        adopted_at: form.adopted_at || null,
        vet_name: form.vet_name || null,
        vet_phone: form.vet_phone || null,
      };
      const { data, error } = await supabase.from("pets").insert(payload).select("id").single();
      if (error) throw error;
      toast.success(`${form.name} cadastrado! 🐾`);
      navigate({ to: "/pet/$petId", params: { petId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setBusy(false); }
  }

  return (
    <MobileShell>
      <header className="px-4 pt-4 flex items-center gap-3">
        <Link to="/perfil" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-xl text-brand">Novo pet 🐾</h1>
      </header>

      <form onSubmit={submit} className="p-4 mt-2 space-y-5">
        {/* Photo */}
        <div className="flex justify-center">
          <ImageUpload
            bucket="pet-photos"
            value={form.photo_url}
            onChange={(url) => set("photo_url", url)}
            label="Foto do pet"
            shape="circle"
          />
        </div>

        <Section title="Identificação">
          <Field label="Nome *">
            <input className="nuppy-input pl-4" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Como ele se chama?" />
          </Field>
          <Field label="Espécie">
            <select className="nuppy-input pl-4 appearance-none" value={form.species} onChange={(e) => set("species", e.target.value)}>
              <option>Cachorro</option><option>Gato</option><option>Coelho</option><option>Pássaro</option>
              <option>Peixe</option><option>Hamster</option><option>Réptil</option><option>Outro</option>
            </select>
          </Field>
          <Field label="Raça">
            <input className="nuppy-input pl-4" value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="Ex: Vira-lata, Golden..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo">
              <select className="nuppy-input pl-4 appearance-none" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">—</option><option value="Macho">Macho ♂</option><option value="Fêmea">Fêmea ♀</option>
              </select>
            </Field>
            <Field label="Porte">
              <select className="nuppy-input pl-4 appearance-none" value={form.size} onChange={(e) => set("size", e.target.value)}>
                <option value="">—</option><option>Mini</option><option>Pequeno</option><option>Médio</option><option>Grande</option><option>Gigante</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cor">
              <input className="nuppy-input pl-4" value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Caramelo, preto..." />
            </Field>
            <Field label="Cidade">
              <input className="nuppy-input pl-4" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Sua cidade" />
            </Field>
          </div>
        </Section>

        <Section title="Dados físicos">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nascimento">
              <input type="date" className="nuppy-input pl-4" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
            </Field>
            <Field label="Adoção">
              <input type="date" className="nuppy-input pl-4" value={form.adopted_at} onChange={(e) => set("adopted_at", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Idade">
              <input className="nuppy-input pl-4" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="Ex: 3 anos" />
            </Field>
            <Field label="Peso">
              <input className="nuppy-input pl-4" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="Ex: 8 kg" />
            </Field>
          </div>
        </Section>

        <Section title="Saúde">
          <div className="flex gap-3">
            <Toggle checked={form.neutered} onChange={(v) => set("neutered", v)} label="Castrado" />
            <Toggle checked={form.vaccinated} onChange={(v) => set("vaccinated", v)} label="Vacinado" />
          </div>
          <Field label="Microchip">
            <input className="nuppy-input pl-4" value={form.microchip} onChange={(e) => set("microchip", e.target.value)} placeholder="Número do chip (se houver)" />
          </Field>
          <Field label="Alergias">
            <textarea className="nuppy-textarea" rows={2} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="Alguma alergia conhecida?" />
          </Field>
          <Field label="Observações médicas">
            <textarea className="nuppy-textarea" rows={2} value={form.medical_notes} onChange={(e) => set("medical_notes", e.target.value)} placeholder="Medicamentos, condições, etc." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Veterinário">
              <input className="nuppy-input pl-4" value={form.vet_name} onChange={(e) => set("vet_name", e.target.value)} placeholder="Nome do(a) vet" />
            </Field>
            <Field label="Telefone do vet">
              <input className="nuppy-input pl-4" value={form.vet_phone} onChange={(e) => set("vet_phone", e.target.value)} placeholder="(11) 99999-9999" />
            </Field>
          </div>
        </Section>

        <Section title="Personalidade">
          <Field label="Como ele(a) é?">
            <textarea className="nuppy-textarea" rows={3} value={form.personality} onChange={(e) => set("personality", e.target.value)} placeholder="Brincalhão, dócil, tímido..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Comida favorita">
              <input className="nuppy-input pl-4" value={form.favorite_food} onChange={(e) => set("favorite_food", e.target.value)} placeholder="Ração, frango..." />
            </Field>
            <Field label="Brinquedo favorito">
              <input className="nuppy-input pl-4" value={form.favorite_toy} onChange={(e) => set("favorite_toy", e.target.value)} placeholder="Bolinha, mordedor..." />
            </Field>
          </div>
          <Field label="Biografia">
            <textarea className="nuppy-textarea" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Conte um pouco a história dele(a)..." />
          </Field>
        </Section>

        <button disabled={busy} className="nuppy-btn-primary">{busy ? "Salvando..." : "Cadastrar pet 🐾"}</button>
      </form>
    </MobileShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nuppy-card p-4 space-y-3">
      <h2 className="font-display text-brand text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-display text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex-1 rounded-full px-3 py-2 text-sm font-display border transition ${
        checked ? "bg-primary text-primary-foreground border-primary" : "bg-card text-brand border-border"
      }`}
    >
      {checked ? "✓ " : ""}{label}
    </button>
  );
}
