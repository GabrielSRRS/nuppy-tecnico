/* ============================================================================
 *  PÁGINA: /auth  —  LOGIN / CADASTRO
 * ----------------------------------------------------------------------------
 *  Única tela PÚBLICA (não está dentro de _authenticated). Aqui o usuário:
 *    • entra com e-mail/senha (Supabase Auth)
 *    • cria conta nova
 *    • entra com Google (via lovable.auth.signInWithOAuth)
 *  Depois do login, é redirecionado para /home automaticamente.
 * ========================================================================== */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { NuppyLogo } from "@/components/NuppyLogo";
import { toast } from "sonner";
import petsHero from "@/assets/pets-hero.jpg";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Nuppy" },
      { name: "description", content: "Entre ou crie sua conta no Nuppy, a rede social dos pets." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name, full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo(a) ao Nuppy 🐾");
        navigate({ to: "/home", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Boas-vindas de volta!");
        navigate({ to: "/home", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(msg.includes("Invalid login") ? "Email ou senha incorretos" : msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Não foi possível entrar com Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="min-h-screen w-full flex justify-center nuppy-bg">
      <div className="relative w-full max-w-[480px] min-h-screen px-6 pt-6 pb-10 flex flex-col">
        {mode === "login" ? (
          <div className="relative -mx-6 -mt-6 pt-2 pb-4">
            <img src={petsHero} alt="Cachorro e gatos felizes" className="w-full h-56 object-cover" width={768} height={512} />
            <div className="absolute inset-x-0 -bottom-8 flex justify-center">
              <NuppyLogo className="h-28 drop-shadow-md" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-2 mb-2">
            <NuppyLogo className="h-24" />
          </div>
        )}

        <div className="mt-10 nuppy-card p-6">
          <h1 className="text-center font-display text-2xl text-brand">
            {mode === "login" ? "Bem-vindo! 👋" : "Crie sua conta"}
          </h1>
          <p className="text-center text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "Faça login para continuar cuidando do seu melhor amigo"
              : "Junte-se à comunidade pet do Nuppy"}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <Field icon={<UserIcon className="size-4" />}>
                <input className="nuppy-input" placeholder="Seu nome" required value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            )}
            <Field icon={<Mail className="size-4" />}>
              <input className="nuppy-input" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field icon={<Lock className="size-4" />}>
              <input
                className="nuppy-input pr-11"
                type={showPwd ? "text" : "password"}
                placeholder="Senha"
                required minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            <button type="submit" disabled={loading} className="nuppy-btn-primary disabled:opacity-60">
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Ou continue com</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button onClick={handleGoogle} disabled={loading} className="nuppy-btn-ghost">
            <GoogleIcon /> Continuar com Google
          </button>

          <p className="text-center text-sm mt-5">
            {mode === "login" ? (
              <>Ainda não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="font-display text-primary">Criar conta</button>
              </>
            ) : (
              <>Já tem conta?{" "}
                <button onClick={() => setMode("login")} className="font-display text-primary">Entrar</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">{icon}</span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.46-1.7 4.28-5.5 4.28-3.31 0-6.01-2.74-6.01-6.12S8.69 6.14 12 6.14c1.88 0 3.14.8 3.86 1.48l2.63-2.54C16.84 3.55 14.62 2.6 12 2.6 6.83 2.6 2.66 6.77 2.66 11.94S6.83 21.28 12 21.28c6.92 0 9.5-4.86 9.5-7.36 0-.5-.06-.88-.13-1.26L12 12.62v-2.42z"/>
      <path fill="#34A853" d="M3.88 7.61l3.21 2.35C7.96 7.93 9.82 6.14 12 6.14c1.88 0 3.14.8 3.86 1.48l2.63-2.54C16.84 3.55 14.62 2.6 12 2.6 8.36 2.6 5.21 4.66 3.88 7.61z" opacity=".0"/>
    </svg>
  );
}
