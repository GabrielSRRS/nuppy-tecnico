import { createFileRoute, Link, useParams, useRouter } from "@tanstack/react-router";
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, MapPin, Phone, Map as MapIcon, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/estabelecimento/$id")({
  head: ({ params }) => ({ meta: [{ title: `Estabelecimento — Nuppy` }] }),
  component: EstabDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <MobileShell>
        <div className="p-8 text-center">
          <p className="text-brand font-display">Algo deu errado.</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          <button onClick={() => { reset(); router.invalidate(); }} className="mt-4 nuppy-btn-primary">Tentar de novo</button>
        </div>
      </MobileShell>
    );
  },
  notFoundComponent: () => (
    <MobileShell>
      <div className="p-8 text-center">
        <p className="font-display text-brand">Estabelecimento não encontrado.</p>
        <Link to="/estabelecimentos" className="text-primary text-sm mt-2 inline-block">← Voltar à lista</Link>
      </div>
    </MobileShell>
  ),
});

const CAT_EMOJI: Record<string, string> = {
  "ONG": "🐾", "Banho": "🛁", "Hotel": "🏨", "Alimentação": "🍖",
  "Veterinário": "🩺", "Pet Shop": "🛍️", "Parque": "🌳", "Café Pet": "☕", "Adestrador": "🦮",
};

function placeQuery(id: string) {
  return {
    queryKey: ["place", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("id,name,category,description,address,city,phone,photo_url,lat,lng")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Estabelecimento não encontrado");
      return data;
    },
  };
}

function EstabDetail() {
  const { id } = useParams({ from: "/_authenticated/estabelecimento/$id" });
  return (
    <MobileShell>
      <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Carregando...</div>}>
        <Body id={id} />
      </Suspense>
    </MobileShell>
  );
}

function Body({ id }: { id: string }) {
  const { data: p } = useSuspenseQuery(placeQuery(id));

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text: p.description ?? "", url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  return (
    <div className="pb-28">
      <div className="relative h-56 bg-accent">
        {p.photo_url ? (
          <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-7xl">{CAT_EMOJI[p.category] ?? "🐾"}</div>
        )}
        <Link to="/estabelecimentos" className="absolute top-4 left-4 size-10 grid place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <button onClick={share} className="absolute top-4 right-4 size-10 grid place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft">
          <Share2 className="size-4 text-brand" />
        </button>
      </div>

      <div className="px-4 -mt-6">
        <div className="nuppy-card p-5">
          <span className="inline-block rounded-full bg-accent text-brand text-[11px] font-display px-3 py-1 uppercase tracking-wide">
            {CAT_EMOJI[p.category] ?? "📍"} {p.category}
          </span>
          <h1 className="font-display text-2xl text-brand mt-2 uppercase">{p.name}</h1>
          {(p.address || p.city) && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="size-4" /> {[p.address, p.city].filter(Boolean).join(" — ")}
            </p>
          )}
          {p.description && <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{p.description}</p>}

          <div className="grid grid-cols-2 gap-2 mt-4">
            {p.phone && (
              <a href={`tel:${p.phone}`} className="rounded-full bg-accent text-brand py-2.5 text-sm font-display inline-flex items-center justify-center gap-1">
                <Phone className="size-4" /> Ligar
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
              target="_blank" rel="noreferrer"
              className={`rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-display inline-flex items-center justify-center gap-1 ${p.phone ? "" : "col-span-2"}`}
            >
              <MapIcon className="size-4" /> Como chegar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
