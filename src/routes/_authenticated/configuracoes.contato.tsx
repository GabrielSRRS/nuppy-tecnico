import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Mail, Instagram } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/configuracoes/contato")({
  head: () => ({ meta: [{ title: "Contato — Nuppy" }] }),
  component: () => (
    <MobileShell>
      <header className="px-4 pt-4 grid grid-cols-[40px_1fr_40px] items-center mb-4">
        <Link to="/configuracoes" className="size-9 grid place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5 text-brand" />
        </Link>
        <h1 className="font-display text-lg text-brand text-center">Entre em contato</h1>
        <span />
      </header>
      <div className="px-4 space-y-3">
        <a href="mailto:contato@nuppy.app" className="nuppy-card p-4 flex items-center gap-3">
          <Mail className="size-5 text-primary" />
          <div>
            <p className="font-display text-brand">E-mail</p>
            <p className="text-xs text-muted-foreground">contato@nuppy.app</p>
          </div>
        </a>
        <a href="https://instagram.com/nuppy.app" target="_blank" rel="noreferrer" className="nuppy-card p-4 flex items-center gap-3">
          <Instagram className="size-5 text-primary" />
          <div>
            <p className="font-display text-brand">Instagram</p>
            <p className="text-xs text-muted-foreground">@nuppy.app</p>
          </div>
        </a>
      </div>
    </MobileShell>
  ),
});
