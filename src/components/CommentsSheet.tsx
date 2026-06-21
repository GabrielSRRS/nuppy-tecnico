/* ============================================================================
 *  COMPONENTE: CommentsSheet  —  MODAL DE COMENTÁRIOS
 * ----------------------------------------------------------------------------
 *  Bottom sheet (modal que sobe do rodapé) que mostra e permite postar
 *  comentários de um post. Usa a tabela `post_comments` e enriquece com
 *  dados do autor (`profiles`). É reaproveitado pela página /social.
 * ========================================================================== */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Comment = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  author?: { username: string; avatar_url: string | null } | null;
};

export function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, body, user_id, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Comment[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      if (!ids.length) return rows;
      const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url").in("id", ids);
      const map = new Map<string, { username: string; avatar_url: string | null }>();
      (profs ?? []).forEach((p: { id: string; username: string; avatar_url: string | null }) =>
        map.set(p.id, { username: p.username, avatar_url: p.avatar_url }),
      );
      return rows.map((r) => ({ ...r, author: map.get(r.user_id) ?? null }));
    },
  });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setBusy(true);
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: userId, body });
    setBusy(false);
    if (error) { toast.error(error.message); setText(body); return; }
    qc.invalidateQueries({ queryKey: ["comments", postId] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["comments", postId] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-t-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display text-brand">Comentários</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-full hover:bg-accent">
            <X className="size-4 text-brand" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Seja o primeiro a comentar 💬</p>
          ) : comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="size-8 rounded-full bg-muted overflow-hidden shrink-0 grid place-items-center">
                {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🐾</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display text-brand">@{c.author?.username ?? "user"}</p>
                <p className="text-sm break-words">{c.body}</p>
              </div>
              {c.user_id === userId && (
                <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-border">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Adicione um comentário..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm"
          />
          <button disabled={busy || !text.trim()} className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
