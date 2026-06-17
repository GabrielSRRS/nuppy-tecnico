import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronLeft, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/comunidade/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Nuppy` }] }),
  component: ChatPage,
});

type Message = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null; display_name: string | null } | null;
};

type CommunityInfo = {
  id: string;
  name: string;
  emoji: string | null;
  cover_url: string | null;
  description: string | null;
  community_members: { user_id: string }[];
};

const chatQuery = (slug: string) => ({
  queryKey: ["community-chat", slug],
  queryFn: async () => {
    const { data: c, error: cErr } = await supabase
      .from("communities")
      .select("id, name, emoji, cover_url, description, community_members(user_id)")
      .eq("slug", slug)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!c) throw new Error("Comunidade não encontrada");

    const { data: msgs, error: mErr } = await supabase
      .from("community_messages")
      .select("id, body, user_id, created_at, profiles(username, avatar_url, display_name)")
      .eq("community_id", (c as CommunityInfo).id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (mErr) throw mErr;
    return { community: c as unknown as CommunityInfo, messages: (msgs as unknown as Message[]) ?? [] };
  },
});

function ChatPage() {
  const { slug } = Route.useParams();
  return (
    <MobileShell>
      <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Abrindo bate-papo...</div>}>
        <Chat slug={slug} />
      </Suspense>
    </MobileShell>
  );
}

function Chat({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(chatQuery(slug));
  const { community, messages } = data;
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);
  const isMember = !!userId && community.community_members.some((m) => m.user_id === userId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription
  useEffect(() => {
    if (!isMember) return;
    const ch = supabase
      .channel(`community-${community.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `community_id=eq.${community.id}` },
        () => qc.invalidateQueries({ queryKey: ["community-chat", slug] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [community.id, isMember, qc, slug]);

  async function join() {
    if (!userId) return;
    const { error } = await supabase.from("community_members").insert({ community_id: community.id, user_id: userId });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["community-chat", slug] });
    qc.invalidateQueries({ queryKey: ["communities"] });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setSending(true);
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("community_messages").insert({
      community_id: community.id, user_id: userId, body,
    });
    setSending(false);
    if (error) { toast.error(error.message); setText(body); return; }
    qc.invalidateQueries({ queryKey: ["community-chat", slug] });
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <header className="px-3 py-3 flex items-center gap-3 border-b border-border bg-card">
        <button onClick={() => navigate({ to: "/comunidades" })} className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </button>
        <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-accent grid place-items-center text-xl overflow-hidden">
          {community.cover_url ? <img src={community.cover_url} alt="" className="w-full h-full object-cover" /> : (community.emoji ?? "🐾")}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-brand truncate">{community.emoji} {community.name}</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="size-3" /> {community.community_members.length} membros
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2 nuppy-bg">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            Ainda sem mensagens. Diga oi para a comunidade! 👋
          </div>
        ) : messages.map((m) => {
          const mine = m.user_id === userId;
          return (
            <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div className={"max-w-[78%] rounded-2xl px-3 py-2 shadow-soft " + (mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card text-foreground rounded-bl-sm")}>
                {!mine && (
                  <p className="text-[11px] font-display text-brand mb-0.5">@{m.profiles?.username ?? "user"}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <p className={"text-[10px] mt-1 " + (mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isMember ? (
        <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-border bg-card">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mensagem"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm"
          />
          <button disabled={sending || !text.trim()} className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="size-5" />
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-border bg-card">
          <button onClick={join} className="w-full nuppy-btn-primary">Entrar na comunidade para conversar</button>
          <Link to="/comunidades" className="block text-center text-xs text-muted-foreground mt-2">Voltar</Link>
        </div>
      )}
    </div>
  );
}
