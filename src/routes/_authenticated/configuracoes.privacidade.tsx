import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/configuracoes/privacidade")({
  head: () => ({ meta: [{ title: "Privacidade — Nuppy" }] }),
  component: () => (
    <MobileShell>
      <Header title="Configurações de privacidade" />
      <div className="px-4 space-y-3 text-sm text-foreground/80">
        <p>Controle quem pode ver seu perfil, seus pets e suas publicações.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Perfil público para todos os tutores</li>
          <li>Apenas membros podem ver as conversas das comunidades</li>
          <li>Seus posts são visíveis no feed social</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-4">Mais opções de privacidade em breve.</p>
      </div>
    </MobileShell>
  ),
});

function Header({ title }: { title: string }) {
  return (
    <header className="px-4 pt-4 grid grid-cols-[40px_1fr_40px] items-center mb-4">
      <Link to="/configuracoes" className="size-9 grid place-items-center rounded-full hover:bg-accent">
        <ChevronLeft className="size-5 text-brand" />
      </Link>
      <h1 className="font-display text-lg text-brand text-center">{title}</h1>
      <span />
    </header>
  );
}
