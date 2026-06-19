import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, MapPin, Phone, X, List, Map as MapIcon, Locate, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/local")({
  head: () => ({ meta: [{ title: "Mapa Pet Friendly — Nuppy" }] }),
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
      .select("id,name,category,description,address,city,lat,lng,phone,photo_url")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
};

const CAT_EMOJI: Record<string, string> = {
  "ONG": "🐾", "Banho": "🛁", "Hotel": "🏨", "Alimentação": "🍖",
  "Veterinário": "🩺", "Pet Shop": "🛍️", "Parque": "🌳", "Café Pet": "☕", "Adestrador": "🦮",
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
        <h1 className="font-display text-xl text-brand">Mapa Pet Friendly</h1>
        <Link to="/estabelecimentos" className="size-9 grid place-items-center rounded-full bg-accent text-brand" title="Lista">
          <List className="size-5" />
        </Link>
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
  const infoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [activeCat, setActiveCat] = useState<string>("Todos");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(places.map((p) => p.category)))], [places]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return places.filter((p) => {
      if (activeCat !== "Todos" && p.category !== activeCat) return false;
      if (q && !(`${p.name} ${p.address ?? ""} ${p.city ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [places, activeCat, search]);

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

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return;
    const center = { lat: -23.5505, lng: -46.6333 };
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center, zoom: 12, disableDefaultUI: true, zoomControl: true, clickableIcons: false,
      styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }],
    });
    infoRef.current = new window.google.maps.InfoWindow();
    locateMe();
  }, [ready]);

  function locateMe() {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapInstance.current?.setCenter(c);
        mapInstance.current?.setZoom(13);
        new window.google.maps.Marker({
          position: c, map: mapInstance.current,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#3b82f6", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
          title: "Você está aqui",
        });
      },
      () => {}, { timeout: 5000 },
    );
  }

  // Render filtered markers
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = filtered.map((p) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapInstance.current!,
        title: p.name,
        label: { text: CAT_EMOJI[p.category] ?? "🐾", fontSize: "20px" },
      });
      marker.addListener("click", () => {
        setSelected(p);
        infoRef.current?.setContent(
          `<div style="font-family:system-ui;padding:2px 4px;max-width:200px">
            <div style="font-weight:700;color:#7c2d12">${escape(p.name)}</div>
            <div style="font-size:11px;color:#92400e">${escape(p.category)}</div>
            ${p.address ? `<div style="font-size:11px;color:#666;margin-top:2px">${escape(p.address)}</div>` : ""}
          </div>`,
        );
        infoRef.current?.open({ anchor: marker, map: mapInstance.current });
      });
      return marker;
    });
  }, [ready, filtered]);

  return (
    <div className="relative">
      <div className="px-4 mt-3">
        <label className="relative block">
          <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar local pet friendly..."
            className="w-full rounded-full bg-card border border-border pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1 scrollbar-none">
          {categories.map((c) => {
            const active = c === activeCat;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-display border transition ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-brand border-border hover:bg-accent"
                }`}
              >
                {c === "Todos" ? "Todos" : `${CAT_EMOJI[c] ?? "📍"} ${c}`}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={mapRef} className="w-full h-[calc(100vh-260px)] bg-muted" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground pointer-events-none">
          <div className="font-display animate-pulse">Carregando Google Maps...</div>
        </div>
      )}

      <button
        onClick={locateMe}
        className="absolute bottom-4 right-4 size-12 rounded-full bg-card shadow-lg grid place-items-center border border-border"
        title="Minha localização"
      >
        <Locate className="size-5 text-primary" />
      </button>

      <Link
        to="/estabelecimentos"
        className="absolute bottom-4 left-4 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-3 inline-flex items-center gap-2 font-display text-sm"
      >
        <List className="size-4" /> Ver lista
      </Link>

      {selected && <PlaceDetail place={selected} onClose={() => { setSelected(null); infoRef.current?.close(); }} />}
    </div>
  );
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function PlaceDetail({ place, onClose }: { place: Place; onClose: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-20 z-10 nuppy-card p-4 shadow-2xl">
      <button onClick={onClose} className="absolute top-2 right-2 size-8 grid place-items-center rounded-full hover:bg-accent">
        <X className="size-4" />
      </button>
      <div className="flex gap-3">
        {place.photo_url ? (
          <img src={place.photo_url} alt={place.name} className="size-20 rounded-xl object-cover" />
        ) : (
          <div className="size-20 rounded-xl bg-accent grid place-items-center text-3xl">{CAT_EMOJI[place.category] ?? "🐾"}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-primary font-display uppercase tracking-wide">{place.category}</p>
          <h3 className="font-display text-brand">{place.name}</h3>
          {place.address && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="size-3" /> {place.address}</p>}
          {place.phone && <a href={`tel:${place.phone}`} className="text-xs text-primary flex items-center gap-1 mt-1"><Phone className="size-3" /> {place.phone}</a>}
        </div>
      </div>
      {place.description && <p className="text-sm text-foreground/80 mt-2 line-clamp-3">{place.description}</p>}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
        target="_blank" rel="noreferrer"
        className="mt-3 block text-center rounded-full bg-primary text-primary-foreground py-2 text-sm font-display"
      >
        <MapIcon className="size-4 inline -mt-0.5 mr-1" /> Como chegar
      </a>
    </div>
  );
}
