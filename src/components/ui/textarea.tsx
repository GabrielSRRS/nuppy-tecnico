import * as React from "react";

import { cn } from "@/lib/utils";

/*
  Textarea
  - Wrapper leve para o elemento <textarea> com estilos padrões do design system.
  - Ideal para mensagens longas, comentários, descrições etc.
  - Expondo a ref, o código consumidor pode controlar foco, seleção e leitura do DOM.

  Dicas de uso:
  - Para auto-resize, combine com libs como `react-textarea-autosize` ou implemente um hook
    que ajuste `rows`/height conforme o conteúdo.
*/
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };