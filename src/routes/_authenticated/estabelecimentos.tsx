/* ============================================================================
 *  PÁGINA: /estabelecimentos  —  LISTA DE ESTABELECIMENTOS
 * ----------------------------------------------------------------------------
 *  Versão "lista com busca" da tabela `places`. Tem busca textual e chips
 *  por categoria. Cada item leva para /estabelecimento/$id.
 * ========================================================================== */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, Search, Mic, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/estabelecimentos")({
  head: () => ({ meta: [{ title: "Estabelecimentos — Nuppy" }] }),
  component: EstabPage,
});

type Place = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  photo_url: string | null;
};

const query = {
  queryKey: ["places", "list"],
  queryFn: async (): Promise<Place[]> => {
    const { data, error } = await supabase
      .from("places")
      .select("id,name,category,description,address,city,phone,photo_url")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
};

const CAT_EMOJI: Record<string, string> = {
  "ONG": "🐾", "Banho": "🛁", "Hotel": "🏨", "Alimentação": "🍖",
  "Veterinário": "🩺", "Pet Shop": "🛍️", "Parque": "🌳", "Café Pet": "☕", "Adestrador": "🦮",
};

function EstabPage() {
  return (
    <MobileShell>
      <header className="px-4 pt-5 flex items-center gap-3">
        <Link to="/home" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="flex-1 text-center font-display text-base text-brand leading-tight uppercase tracking-wide pr-9">
          Tudo o que seu pet<br/>precisa, em um só lugar!
        </h1>
      </header>

      <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Carregando...</div>}>
        <Body />
      </Suspense>
    </MobileShell>
  );
}

function Body() {
  const { data } = useSuspenseQuery(query);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("Todos");

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(data.map((p) => p.category)))],
    [data],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter((p) => {
      if (cat !== "Todos" && p.category !== cat) return false;
      if (!s) return true;
      return `${p.name} ${p.description ?? ""} ${p.address ?? ""}`.toLowerCase().includes(s);
    });
  }, [data, q, cat]);

  return (
    <>
      <div className="px-4 mt-4">
        <label className="relative block">
          <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-full bg-card border border-border pl-11 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 shadow-card"
          />
          <button className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-primary grid place-items-center text-primary-foreground">
            <Mic className="size-4" />
          </button>
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto py-3 px-4 scrollbar-none">
        {categories.map((c) => {
          const active = c === cat;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-display border transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-transparent text-brand border-transparent hover:bg-accent"
              }`}
            >
              {c === "Todos" ? "Todos" : `${CAT_EMOJI[c] ?? "📍"} ${c}`}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-28 space-y-3">
        {filtered.length === 0 && (
          <div className="nuppy-card p-8 text-center text-muted-foreground">
            <div className="text-5xl mb-2">🔎</div>
            Nenhum estabelecimento encontrado.
          </div>
        )}
        {filtered.map((p) => (
          <Link
            key={p.id}
            to="/estabelecimento/$id"
            params={{ id: p.id }}
            className="nuppy-card p-4 flex gap-3 items-start hover:shadow-soft transition"
          >
            <div className="size-16 rounded-xl bg-accent grid place-items-center text-3xl overflow-hidden shrink-0">
              {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : (CAT_EMOJI[p.category] ?? "🐾")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-brand uppercase tracking-wide text-sm">{p.name}</h3>
              {p.description && <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">{p.description}</p>}
              {p.city && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="size-3" /> {p.city}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
