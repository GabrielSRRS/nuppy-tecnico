import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, Suspense } from "react";
import { Heart, MessageCircle, Share2, Plus, ChevronLeft, Camera, Loader2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { CommentsSheet } from "@/components/CommentsSheet";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/social")({
  head: () => ({ meta: [{ title: "Social — Nuppy" }] }),
  component: SocialPage,
});

type Post = {
  id: string;
  author_id: string;
  media_url: string;
  media_type: string | null;
  caption: string | null;
  hashtags: string[] | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
  likes: { user_id: string }[];
  post_comments: { id: string }[];
};

const feedQuery = {
  queryKey: ["feed"],
  queryFn: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, author_id, media_url, media_type, caption, hashtags, created_at, profiles(username, avatar_url), likes(user_id), post_comments(id)")
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
        <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a compartilhar uma foto ou vídeo do seu pet!</p>
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
  const [showComments, setShowComments] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const liked = !!userId && post.likes.some((l) => l.user_id === userId);
  const likeCount = post.likes.length;
  const commentCount = post.post_comments?.length ?? 0;
  const isVideo = post.media_type === "video";

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

  async function share() {
    const url = `${window.location.origin}/social#post-${post.id}`;
    const text = post.caption
      ? `${post.caption}\n— @${post.profiles?.username ?? "nuppy"} no Nuppy`
      : `Veja este ${isVideo ? "vídeo" : "post"} de @${post.profiles?.username ?? "nuppy"} no Nuppy 🐾`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Nuppy", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Link copiado!");
      }
    } catch { /* user cancelled */ }
  }

  return (
    <article id={`post-${post.id}`} className="relative">
      <div className="relative bg-black">
        {isVideo ? (
          <video src={post.media_url} className="w-full aspect-[9/14] object-cover" controls playsInline preload="metadata" />
        ) : (
          <img src={post.media_url} alt={post.caption ?? "Post"} className="w-full aspect-[9/14] object-cover" loading="lazy" />
        )}
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 text-white drop-shadow-md">
          <button onClick={() => toggleLike.mutate()} className="flex flex-col items-center">
            <Heart className={"size-8 " + (liked ? "fill-love text-love" : "text-white")} />
            <span className="text-xs font-display">{likeCount}</span>
          </button>
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center">
            <MessageCircle className="size-8" />
            <span className="text-xs font-display">{commentCount}</span>
          </button>
          <button onClick={share} className="flex flex-col items-center">
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
      {showComments && <CommentsSheet postId={post.id} onClose={() => setShowComments(false)} />}
    </article>
  );
}

function NewPostButton() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith("video/");
    if (file.size > (isVid ? 50 : 8) * 1024 * 1024) {
      toast.error(isVid ? "Vídeo máx 50MB" : "Imagem máx 8MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMedia("post-media", file);
      setMediaUrl(url);
      setMediaType(isVid ? "video" : "image");
      toast.success(isVid ? "Vídeo enviado!" : "Foto enviada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaUrl) { toast.error("Envie uma foto ou vídeo"); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login");
      const hashtags = tags.split(/[\s,#]+/).map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from("posts").insert({
        author_id: user.id, media_url: mediaUrl, caption, hashtags, media_type: mediaType,
      });
      if (error) throw error;
      toast.success("Post publicado!");
      setOpen(false); setMediaUrl(""); setMediaType("image"); setCaption(""); setTags("");
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
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-[480px] bg-card rounded-t-3xl sm:rounded-3xl p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl text-brand">Novo post</h3>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/5] max-h-[300px] rounded-2xl border-2 border-dashed border-border bg-muted overflow-hidden grid place-items-center relative"
            >
              {mediaUrl ? (
                mediaType === "video" ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls playsInline />
                ) : (
                  <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="flex gap-3">
                    <Camera className="size-7" />
                    <Video className="size-7" />
                  </div>
                  <span className="text-sm font-display">Enviar foto ou vídeo</span>
                  <span className="text-xs">imagem até 8MB • vídeo até 50MB</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={pickFile} />

            <textarea className="w-full rounded-2xl border border-border bg-card p-3 text-sm" rows={3} placeholder="Legenda" value={caption} onChange={(e) => setCaption(e.target.value)} />
            <input className="nuppy-input pl-4" placeholder="hashtags (parque, vidapet)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <button disabled={busy || uploading} className="nuppy-btn-primary">{busy ? "Publicando..." : "Publicar"}</button>
            <button type="button" onClick={() => setOpen(false)} className="nuppy-btn-ghost">Cancelar</button>
          </form>
        </div>
      )}
    </>
  );
}
