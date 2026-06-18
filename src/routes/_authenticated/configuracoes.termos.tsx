import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/configuracoes/termos")({
  head: () => ({ meta: [{ title: "Termos — Nuppy" }] }),
  component: () => (
    <MobileShell>
      <header className="px-4 pt-4 grid grid-cols-[40px_1fr_40px] items-center mb-4">
        <Link to="/configuracoes" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-lg text-brand text-center">Termos e condições</h1>
        <span />
      </header>
      <div className="px-4 space-y-3 text-sm text-foreground/80 pb-24">
        <p>Bem-vindo ao Nuppy! Ao usar o aplicativo você concorda com os termos abaixo.</p>
        <h3 className="font-display text-brand mt-4">Uso da plataforma</h3>
        <p>O Nuppy é uma rede social para tutores de pets. Conteúdos ofensivos, comerciais não autorizados ou que violem direitos de terceiros serão removidos.</p>
        <h3 className="font-display text-brand mt-4">Responsabilidades</h3>
        <p>Você é responsável pelo conteúdo que publica e pelas interações com outros usuários. Trate os outros tutores com respeito.</p>
        <h3 className="font-display text-brand mt-4">Contato</h3>
        <p>Dúvidas? Fale com a gente em contato@nuppy.app.</p>
      </div>
    </MobileShell>
  ),
});
