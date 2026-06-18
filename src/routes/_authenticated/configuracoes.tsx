import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Moon, Shield, Headphones, AlertCircle, Lock, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Nuppy" }] }),
  component: ConfigPage,
});

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("nuppy-theme") === "dark";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
    localStorage.setItem("nuppy-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, setDark] as const;
}

function ConfigPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dark, setDark] = useDarkMode();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null; display_name: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("username, avatar_url, display_name").eq("id", data.user.id).maybeSingle();
      setProfile(p as typeof profile);
    });
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <MobileShell>
      <header className="px-4 pt-4 grid grid-cols-3 items-center">
        <Link to="/perfil" className="size-9 grid place-items-center rounded-full hover:bg-accent justify-self-start">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-xl text-brand text-center">Perfil</h1>
        <span />
      </header>

      <Link to="/perfil" className="mx-4 mt-6 flex items-center gap-3 nuppy-card p-3">
        <div className="size-12 rounded-full bg-muted overflow-hidden grid place-items-center">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span>🐾</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-brand truncate">@{profile?.username ?? "seu_perfil"}</p>
          {profile?.display_name && <p className="text-xs text-muted-foreground truncate">{profile.display_name}</p>}
        </div>
        <ChevronRight className="size-5 text-primary" />
      </Link>

      <h2 className="px-4 mt-6 mb-2 font-display text-brand text-lg">Configurações</h2>

      <div className="px-4 space-y-2 pb-24">
        <Row icon={<Moon className="size-5" />} label="Modo Escuro">
          <button
            role="switch"
            aria-checked={dark}
            onClick={() => setDark(!dark)}
            className={"relative w-12 h-7 rounded-full transition " + (dark ? "bg-primary" : "bg-muted")}
          >
            <span className={"absolute top-0.5 size-6 rounded-full bg-card shadow transition-all " + (dark ? "left-[22px]" : "left-0.5")} />
          </button>
        </Row>

        <LinkRow to="/configuracoes/privacidade" icon={<Shield className="size-5" />} label="Configurações de privacidade" />
        <LinkRow to="/configuracoes/contato" icon={<Headphones className="size-5" />} label="Entre em contato" />
        <LinkRow to="/configuracoes/termos" icon={<AlertCircle className="size-5" />} label="Termos e condições" />
        <LinkRow to="/configuracoes/privacidade-politica" icon={<Lock className="size-5" />} label="Política de privacidade" />

        <button onClick={signOut} className="w-full mt-4 nuppy-btn-ghost text-destructive">
          <LogOut className="size-4" /> Sair da conta
        </button>
      </div>
    </MobileShell>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="size-10 rounded-full bg-muted grid place-items-center text-primary">{icon}</div>
      <p className="flex-1 text-sm font-display text-foreground">{label}</p>
      {children}
    </div>
  );
}

function LinkRow({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 py-3 hover:bg-accent rounded-2xl px-1">
      <div className="size-10 rounded-full bg-muted grid place-items-center text-primary">{icon}</div>
      <p className="flex-1 text-sm font-display text-foreground">{label}</p>
      <ChevronRight className="size-5 text-primary" />
    </Link>
  );
}
