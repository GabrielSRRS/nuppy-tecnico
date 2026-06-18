import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/configuracoes/privacidade-politica")({
  head: () => ({ meta: [{ title: "Política de privacidade — Nuppy" }] }),
  component: () => (
    <MobileShell>
      <header className="px-4 pt-4 grid grid-cols-[40px_1fr_40px] items-center mb-4">
        <Link to="/configuracoes" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-lg text-brand text-center">Política de privacidade</h1>
        <span />
      </header>
      <div className="px-4 space-y-3 text-sm text-foreground/80 pb-24">
        <p>Levamos sua privacidade a sério. Coletamos apenas os dados necessários para o funcionamento do app.</p>
        <h3 className="font-display text-brand mt-4">Dados coletados</h3>
        <p>Nome, e-mail, foto de perfil, informações dos seus pets, posts e localização aproximada (quando você usa o mapa).</p>
        <h3 className="font-display text-brand mt-4">Uso dos dados</h3>
        <p>Usamos seus dados para personalizar sua experiência, exibir conteúdos relevantes e conectar você com outros tutores.</p>
        <h3 className="font-display text-brand mt-4">Compartilhamento</h3>
        <p>Não vendemos seus dados. Compartilhamos apenas o necessário com provedores que ajudam a operar o Nuppy.</p>
      </div>
    </MobileShell>
  ),
});
