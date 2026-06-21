/* ============================================================================
 *  LAYOUT: _authenticated  —  GUARDA DE AUTENTICAÇÃO
 * ----------------------------------------------------------------------------
 *  Este é um "layout route" do TanStack Router. O underscore (_) no nome
 *  significa que ele NÃO aparece na URL — serve só para envolver outras rotas.
 *
 *  Tudo que está dentro de `src/routes/_authenticated/` exige que o usuário
 *  esteja LOGADO. Se não estiver, é redirecionado para /auth.
 *
 *  ⚠️ Arquivo gerenciado pela integração do Lovable Cloud — NÃO EDITAR.
 *  Para criar páginas protegidas novas, basta criar arquivos dentro dessa
 *  pasta (ex: src/routes/_authenticated/minha-pagina.tsx) e elas já vão
 *  herdar a proteção.
 * ========================================================================== */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
