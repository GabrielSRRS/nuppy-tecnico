import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, MapPin, Phone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/local")({
  head: () => ({ meta: [{ title: "Locais Pet Friendly — Nuppy" }] }),
  component: LocalPage,
});

type Place = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  photo_url: string | null;
};

const placesQuery = {
  queryKey: ["places"],
  queryFn: async (): Promise<Place[]> => {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

const CATEGORIES = ["Veterinário", "Pet Shop", "Parque", "Hotel Pet", "Café Pet", "Adestrador"];
const CAT_EMOJI: Record<string, string> = {
  "Veterinário": "🩺", "Pet Shop": "🛍️", "Parque": "🌳",
  "Hotel Pet": "🏨", "Café Pet": "☕", "Adestrador": "🦮",
};

declare global {
  interface Window {
    google?: any;
    __nuppyInitMap?: () => void;
  }
}

function LocalPage() {
  return (
    <MobileShell>
      <header className="px-4 pt-4 flex items-center justify-between">
        <Link to="/home" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-xl text-brand">Locais Pet Friendly</h1>
        <div className="size-9" />
      </header>
      <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Carregando mapa...</div>}>
        <MapBody />
      </Suspense>
    </MobileShell>
  );
}

function MapBody() {
  const { data: places } = useSuspenseQuery(placesQuery);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [adding, setAdding] = useState<{ lat: number; lng: number } | null>(null);

  // Load Google Maps script once
  useEffect(() => {
    if (window.google?.maps) { setReady(true); return; }
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    window.__nuppyInitMap = () => setReady(true);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__nuppyInitMap&channel=${channel}`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return;
    const center = { lat: -23.5505, lng: -46.6333 }; // São Paulo default
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center, zoom: 12, disableDefaultUI: true, zoomControl: true,
    });

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => mapInstance.current?.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 },
      );
    }

    // Long press / right click to add a place
    mapInstance.current.addListener("click", (e: any) => {
      if (!e.latLng) return;
      setAdding({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
  }, [ready]);

  // Render markers
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = places.map((p) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapInstance.current!,
        title: p.name,
        label: { text: CAT_EMOJI[p.category] ?? "🐾", fontSize: "20px" },
      });
      marker.addListener("click", () => setSelected(p));
      return marker;
    });
  }, [ready, places]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[calc(100vh-180px)] bg-muted" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <div className="font-display animate-pulse">Carregando Google Maps...</div>
        </div>
      )}

      <div className="absolute top-2 left-2 right-2 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <span key={c} className="shrink-0 rounded-full bg-card/95 border border-border px-3 py-1 text-xs font-display text-brand">
            {CAT_EMOJI[c]} {c}
          </span>
        ))}
      </div>

      <button
        onClick={() => {
          const c = mapInstance.current?.getCenter();
          if (c) setAdding({ lat: c.lat(), lng: c.lng() });
        }}
        className="absolute bottom-4 right-4 size-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center"
        title="Adicionar local"
      >
        <Plus className="size-6" />
      </button>

      {selected && <PlaceDetail place={selected} onClose={() => setSelected(null)} />}
      {adding && <AddPlaceModal coords={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}

function PlaceDetail({ place, onClose }: { place: Place; onClose: () => void }) {
  return (
    <div className="absolute inset-x-2 bottom-4 z-10 nuppy-card p-4">
      <button onClick={onClose} className="absolute top-2 right-2 size-8 grid place-items-center rounded-full hover:bg-accent">
        <X className="size-4" />
      </button>
      <div className="flex gap-3">
        {place.photo_url ? (
          <img src={place.photo_url} alt={place.name} className="size-20 rounded-xl object-cover" />
        ) : (
          <div className="size-20 rounded-xl bg-muted grid place-items-center text-3xl">{CAT_EMOJI[place.category] ?? "🐾"}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary font-display">{place.category}</p>
          <h3 className="font-display text-brand">{place.name}</h3>
          {place.address && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="size-3" /> {place.address}</p>}
          {place.phone && <a href={`tel:${place.phone}`} className="text-xs text-primary flex items-center gap-1 mt-1"><Phone className="size-3" /> {place.phone}</a>}
        </div>
      </div>
      {place.description && <p className="text-sm text-foreground/80 mt-2">{place.description}</p>}
    </div>
  );
}

function AddPlaceModal({ coords, onClose }: { coords: { lat: number; lng: number }; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", category: "Veterinário", description: "", address: "", city: "", phone: "", photo_url: "",
  });
  const [busy, setBusy] = useState(false);
  const upd = <K extends keyof typeof form>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login");
      const { error } = await supabase.from("places").insert({
        ...form, lat: coords.lat, lng: coords.lng, created_by: user.id, photo_url: form.photo_url || null,
      });
      if (error) throw error;
      toast.success("Local adicionado!");
      qc.invalidateQueries({ queryKey: ["places"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end sm:place-items-center" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="w-full max-w-[480px] bg-card rounded-t-3xl sm:rounded-3xl p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-xl text-brand">Novo local pet friendly</h3>
        <p className="text-xs text-muted-foreground">📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
        <div className="flex justify-center"><ImageUpload bucket="place-photos" value={form.photo_url} onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))} /></div>
        <input className="nuppy-input pl-4" placeholder="Nome do local" required value={form.name} onChange={upd("name")} />
        <select className="nuppy-input pl-4" value={form.category} onChange={upd("category")}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="nuppy-input pl-4" placeholder="Endereço" value={form.address} onChange={upd("address")} />
        <div className="grid grid-cols-2 gap-3">
          <input className="nuppy-input pl-4" placeholder="Cidade" value={form.city} onChange={upd("city")} />
          <input className="nuppy-input pl-4" placeholder="Telefone" value={form.phone} onChange={upd("phone")} />
        </div>
        <textarea className="w-full rounded-2xl border border-border bg-card p-3 text-sm" rows={2} placeholder="Descrição" value={form.description} onChange={upd("description")} />
        <button disabled={busy} className="nuppy-btn-primary">{busy ? "Salvando..." : "Adicionar local"}</button>
        <button type="button" onClick={onClose} className="nuppy-btn-ghost">Cancelar</button>
      </form>
    </div>
  );
}
