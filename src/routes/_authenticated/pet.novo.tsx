import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pet/novo")({
  head: () => ({ meta: [{ title: "Novo Pet — Nuppy" }] }),
  component: NovoPet,
});

function NovoPet() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", species: "Cachorro", breed: "", age: "", weight: "", photo_url: "", description: "", city: "",
  });
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const { data, error } = await supabase.from("pets").insert({
        owner_id: user.id, ...form, photo_url: form.photo_url || null,
      }).select("id").single();
      if (error) throw error;
      toast.success(`${form.name} cadastrado!`);
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
      <form onSubmit={submit} className="p-4 mt-2 space-y-3">
        <input className="nuppy-input pl-4" placeholder="Nome do pet" required value={form.name} onChange={update("name")} />
        <select className="nuppy-input pl-4 appearance-none" value={form.species} onChange={update("species")}>
          <option>Cachorro</option><option>Gato</option><option>Coelho</option><option>Pássaro</option><option>Outro</option>
        </select>
        <input className="nuppy-input pl-4" placeholder="Raça" value={form.breed} onChange={update("breed")} />
        <div className="grid grid-cols-2 gap-3">
          <input className="nuppy-input pl-4" placeholder="Idade (ex: 3 anos)" value={form.age} onChange={update("age")} />
          <input className="nuppy-input pl-4" placeholder="Peso (ex: 8kg)" value={form.weight} onChange={update("weight")} />
        </div>
        <input className="nuppy-input pl-4" placeholder="Cidade" value={form.city} onChange={update("city")} />
        <input className="nuppy-input pl-4" placeholder="URL da foto" value={form.photo_url} onChange={update("photo_url")} />
        <textarea className="w-full rounded-2xl border border-border bg-card p-3 text-sm" rows={3} placeholder="Descrição" value={form.description} onChange={update("description")} />
        <button disabled={busy} className="nuppy-btn-primary">{busy ? "Salvando..." : "Cadastrar pet"}</button>
      </form>
    </MobileShell>
  );
}
