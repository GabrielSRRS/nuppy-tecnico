import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, Suspense } from "react";
import { Heart, MessageCircle, Share2, Plus, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/social")({
  head: () => ({ meta: [{ title: "Social — Nuppy" }] }),
  component: SocialPage,
});

type Post = {
  id: string;
  author_id: string;
  media_url: string;
  caption: string | null;
  hashtags: string[] | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
  likes: { user_id: string }[];
};

const feedQuery = {
  queryKey: ["feed"],
  queryFn: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, author_id, media_url, caption, hashtags, created_at, profiles(username, avatar_url), likes(user_id)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data as unknown as Post[]) ?? [];
  },
};

function SocialPage() {
  return (
    <MobileShell>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-border">
        <Link to="/home" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-xl text-brand">Feed Social</h1>
        <NewPostButton />
      </header>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
        <Feed />
      </Suspense>
    </MobileShell>
  );
}

function Feed() {
  const { data } = useSuspenseQuery(feedQuery);
  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-3">📸</div>
        <p className="font-display text-brand text-lg">Nenhum post ainda</p>
        <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a compartilhar uma foto do seu pet!</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {data.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const liked = !!userId && post.likes.some((l) => l.user_id === userId);
  const likeCount = post.likes.length;

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      if (liked) {
        await supabase.from("likes").delete().eq("user_id", userId).eq("post_id", post.id);
      } else {
        await supabase.from("likes").insert({ user_id: userId, post_id: post.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  return (
    <article className="relative">
      <div className="relative bg-black">
        <img src={post.media_url} alt={post.caption ?? "Post"} className="w-full aspect-[9/14] object-cover" loading="lazy" />
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 text-white drop-shadow-md">
          <button onClick={() => toggleLike.mutate()} className="flex flex-col items-center">
            <Heart className={"size-8 " + (liked ? "fill-love text-love" : "text-white")} />
            <span className="text-xs font-display">{likeCount}</span>
          </button>
          <button className="flex flex-col items-center">
            <MessageCircle className="size-8" />
            <span className="text-xs font-display">0</span>
          </button>
          <button className="flex flex-col items-center">
            <Share2 className="size-8" />
            <span className="text-xs font-display">↗</span>
          </button>
        </div>
        <div className="absolute left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
          <p className="font-display text-base">@{post.profiles?.username ?? "user"}</p>
          {post.caption && <p className="text-sm mt-1 line-clamp-2">{post.caption}</p>}
          {post.hashtags && post.hashtags.length > 0 && (
            <p className="text-xs text-white/80 mt-1">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function NewPostButton() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login");
      const hashtags = tags.split(/[\s,#]+/).map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from("posts").insert({
        author_id: user.id, media_url: url, caption, hashtags, media_type: "image",
      });
      if (error) throw error;
      toast.success("Post publicado!");
      setOpen(false); setUrl(""); setCaption(""); setTags("");
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setBusy(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="size-9 grid place-items-center rounded-full bg-primary text-primary-foreground">
        <Plus className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end sm:place-items-center" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-[480px] bg-card rounded-t-3xl sm:rounded-3xl p-6 space-y-3">
            <h3 className="font-display text-xl text-brand">Novo post</h3>
            <input className="nuppy-input pl-4" placeholder="URL da imagem (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} required />
            <textarea className="w-full rounded-2xl border border-border bg-card p-3 text-sm" rows={3} placeholder="Legenda" value={caption} onChange={(e) => setCaption(e.target.value)} />
            <input className="nuppy-input pl-4" placeholder="hashtags (parque, vidapet)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <button disabled={busy} className="nuppy-btn-primary">{busy ? "Publicando..." : "Publicar"}</button>
            <button type="button" onClick={() => setOpen(false)} className="nuppy-btn-ghost">Cancelar</button>
          </form>
        </div>
      )}
    </>
  );
}
