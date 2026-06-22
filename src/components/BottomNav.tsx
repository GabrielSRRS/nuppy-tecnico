/* ============================================================================
 *  COMPONENTE: BottomNav  —  BARRA DE NAVEGAÇÃO INFERIOR
 * ----------------------------------------------------------------------------
 *  É a "barrinha" fixa no rodapé com 5 ícones (Home, Social, Local,
 *  Grupos, Perfil). Aparece em TODAS as páginas autenticadas porque está
 *  embutida dentro do MobileShell.
 *
 *  👉 GUIA RÁPIDO PRA MEXER:
 *  - Quer ADICIONAR/REMOVER um botão?         → mexa no array `items` (linha ~28)
 *  - Quer trocar um ÍCONE?                    → troque o componente do lucide-react
 *  - Quer mudar a COR do ícone quando ativo?  → propriedade `color` no item
 *  - Quer mudar a COR DO FUNDO da barra?      → classe `bg-card/95` (linha ~58)
 *  - Quer mudar o tamanho dos ícones?         → `size-5` na linha ~70
 *  - Quer mudar a sombra/“flutuação” da barra?→ classe `shadow-[...]` linha ~58
 *  - Quer mudar a cor do botão ATIVO (fundo)? → classe `bg-primary/15` linha ~67
 * ========================================================================== */
import { Link, useRouterState } from "@tanstack/react-router";
import { PawPrint, Heart, MapPin, Users, User } from "lucide-react";

/* ----------------------------------------------------------------------------
 * LISTA DOS BOTÕES DA BARRA
 * Cada item vira um ícone na barrinha. A ordem aqui é a ordem na tela
 * (esquerda → direita). Pra adicionar um novo botão é só copiar uma linha.
 *
 * Campos:
 *  - to    : rota pra onde o botão leva (precisa existir em src/routes/)
 *  - label : texto que aparece embaixo do ícone
 *  - icon  : componente de ícone (importado do lucide-react lá em cima)
 *  - color : classe Tailwind que define a COR quando o botão está ATIVO
 *            (ex.: text-primary = laranja, text-love = rosa/vermelho)
 * -------------------------------------------------------------------------- */
const items = [
  { to: "/home",         label: "Início", icon: PawPrint, color: "text-primary" },     // 🏠 Home (laranja)
  { to: "/social",       label: "Social", icon: Heart,    color: "text-love" },        // ❤️ Feed (rosa)
  { to: "/local",        label: "Local",  icon: MapPin,   color: "text-brand-soft" },  // 📍 Mapa
  { to: "/comunidades",  label: "Grupos", icon: Users,    color: "text-primary" },     // 👥 Comunidades
  { to: "/perfil",       label: "Perfil", icon: User,     color: "text-brand" },       // 👤 Perfil
] as const;

export function BottomNav() {
  // Pega a URL atual pra saber qual botão deve aparecer "selecionado" (ativo).
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    // <nav> = container fixo no rodapé.
    //   • fixed bottom-0           → gruda na parte de baixo da tela
    //   • left-1/2 -translate-x-1/2 → centraliza horizontalmente
    //   • max-w-[480px]            → largura máxima (estilo celular)
    //   • z-40                     → fica por cima do conteúdo
    //   • pb-[max(...,env(safe-area-inset-bottom))] → respeita o "queixo"
    //     do iPhone (área segura embaixo)
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3">
      {/* CAIXINHA BRANCA que envolve os ícones.
          • bg-card/95 backdrop-blur → fundo branco translúcido com desfoque
          • border border-border     → contorno suave
          • rounded-3xl              → cantos bem arredondados
          • shadow-[...]             → sombrinha "flutuante" pra cima        */}
      <div className="flex items-center justify-between gap-1 rounded-3xl bg-card/95 backdrop-blur border border-border shadow-[0_-6px_24px_-12px_rgba(180,120,40,0.35)] p-2">
        {items.map(({ to, label, icon: Icon, color }) => {
          // O botão é considerado "ativo" se a URL atual começa com a rota dele.
          const active = pathname.startsWith(to);
          return (
            // CADA BOTÃO da barra é um <Link> (navegação sem recarregar a página).
            <Link
              key={to}
              to={to}
              className={
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition " +
                // 👇 AQUI é a COR DE FUNDO do botão selecionado.
                //    `bg-primary/15` = laranja bem clarinho (15% de opacidade).
                //    Pra mudar pra outra cor, troque pra ex.: `bg-love/15`.
                (active ? "bg-primary/15" : "hover:bg-accent/50")
              }
            >
              {/* ÍCONE:
                  • size-5      → tamanho (20px). Aumente pra size-6 se quiser maior.
                  • strokeWidth → grossura do traço (2.2 = mais "encorpado")
                  • cor: usa `color` do item quando ATIVO, senão fica cinza */}
              <Icon
                className={(active ? color : "text-muted-foreground") + " size-5"}
                strokeWidth={2.2}
              />
              {/* TEXTO embaixo do ícone (pequenininho, 10px).
                  Fica colorido (`text-brand`) quando ativo, cinza quando não. */}
              <span className={"text-[10px] font-display " + (active ? "text-brand" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
