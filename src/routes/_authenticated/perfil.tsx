import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { ChevronLeft, Menu, Settings, Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Nuppy" }] }),
  component: PerfilPage,
});

const meQuery = {
  queryKey: ["me"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not authenticated");
    const [{ data: profile }, { data: pets }, { data: posts }, { data: liked }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("pets").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("posts").select("id, media_url, media_type").eq("author_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("likes")
        .select("post_id, posts!inner(id, media_url, media_type)")
        .eq("user_id", user.id)
        .eq("posts.media_type", "video")
        .order("created_at", { ascending: false }),
    ]);
    const likedVideos = ((liked ?? []) as unknown as { posts: { id: string; media_url: string; media_type: string | null } }[])
      .map((l) => l.posts)
      .filter(Boolean);
    return { user, profile, pets: pets ?? [], posts: posts ?? [], likedVideos };
  },
};

function PerfilPage() {
  const navigate = useNavigate();
  void navigate;

  return (
    <MobileShell>
      <header className="px-4 pt-4 flex items-center justify-between">
        <Link to="/home" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-xl text-brand">Perfil</h1>
        <Link to="/configuracoes" title="Configurações" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <Settings className="size-5 text-brand" />
        </Link>
      </header>
      <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Carregando...</div>}>
        <PerfilBody />
      </Suspense>
    </MobileShell>
  );
}

function PerfilBody() {
  const { data } = useSuspenseQuery(meQuery);
  const { profile, pets, posts, likedVideos } = data;
  const [editing, setEditing] = useState(false);

  return (
    <div className="px-4 pt-4">
      <div className="flex flex-col items-center text-center">
        <div className="size-32 rounded-full bg-muted border-4 border-card shadow-card overflow-hidden grid place-items-center">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">🐾</span>
          )}
        </div>
        <h2 className="mt-3 font-display text-2xl text-brand">{profile?.display_name ?? "Você"}</h2>
        <p className="text-sm text-muted-foreground">@{profile?.username}</p>
        <p className="text-sm mt-1 text-foreground/80">{profile?.bio ?? "Adicione uma biografia"}</p>
        <button onClick={() => setEditing(true)} className="mt-3 px-8 py-2 rounded-full bg-primary text-primary-foreground font-display text-sm shadow-soft inline-flex items-center gap-2">
          <Pencil className="size-4" /> Editar
        </button>
      </div>

      <Stats pets={pets.length} posts={posts.length} />

      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-brand">Meus pets</h3>
          <Link to="/pet/novo" className="text-sm font-display text-primary inline-flex items-center gap-1">
            <Plus className="size-4" /> Adicionar
          </Link>
        </div>
        {pets.length === 0 ? (
          <div className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
            Você ainda não cadastrou nenhum pet 🐶
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {pets.map((p) => (
              <Link key={p.id} to="/pet/$petId" params={{ petId: p.id }} className="aspect-square rounded-2xl overflow-hidden bg-muted relative">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-3xl">🐾</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white p-1.5 text-xs font-display">{p.name}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="font-display text-brand mb-2">Posts</h3>
        {posts.length === 0 ? (
          <div className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
            Nenhum post ainda
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((p) => (
              <div key={p.id} className="aspect-square bg-muted overflow-hidden rounded-md">
                <img src={p.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 pb-24">
        <h3 className="font-display text-brand mb-2">❤️ Vídeos curtidos</h3>
        {likedVideos.length === 0 ? (
          <div className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
            Você ainda não curtiu nenhum vídeo
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {likedVideos.map((v) => (
              <div key={v.id} className="aspect-square bg-black overflow-hidden rounded-md relative">
                <video src={v.media_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                <div className="absolute bottom-1 right-1 text-white text-xs bg-black/60 rounded px-1">▶</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editing && <EditModal profile={profile} onClose={() => setEditing(false)} />}
    </div>
  );
}

function Stats({ pets, posts }: { pets: number; posts: number }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 nuppy-card p-3">
      <Stat label="Pets" value={pets} />
      <Stat label="Posts" value={posts} />
      <Stat label="Seguidores" value={0} />
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl text-brand">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EditModal({ profile, onClose }: { profile: { display_name: string | null; bio: string | null; city: string | null; avatar_url: string | null } | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      display_name: name, bio, city, avatar_url: avatar || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado!");
    qc.invalidateQueries({ queryKey: ["me"] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end sm:place-items-center" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="w-full max-w-[480px] bg-card rounded-t-3xl sm:rounded-3xl p-6 space-y-3">
        <h3 className="font-display text-xl text-brand">Editar perfil</h3>
        <input className="nuppy-input pl-4" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="w-full rounded-2xl border border-border bg-card p-3 text-sm" rows={2} placeholder="Biografia" value={bio} onChange={(e) => setBio(e.target.value)} />
        <input className="nuppy-input pl-4" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="nuppy-input pl-4" placeholder="URL da foto de perfil" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
        <button disabled={busy} className="nuppy-btn-primary">{busy ? "Salvando..." : "Salvar"}</button>
        <button type="button" onClick={onClose} className="nuppy-btn-ghost">Cancelar</button>
      </form>
    </div>
  );
}

// keep imports used
void Menu;
