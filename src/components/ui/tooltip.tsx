"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

/*
  Tooltip
  - Wrapper sobre Radix Tooltip para padronizar o estilo das dicas (tooltips) na aplicação.
  - Expondo Provider, Root, Trigger e Content já estilizados facilita o reuso.

  Props importantes:
  - sideOffset: distância entre o trigger e o conteúdo do tooltip (padrão = 4).

  Acessibilidade:
  - Radix cuida da maior parte da acessibilidade (aria-describedby, foco, etc.).
  - Use TooltipTrigger em conjunto com elementos que suportem aria-describedby para
    garantir que leitores de tela consigam identificar o conteúdo quando necessário.
*/
const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Classes para aparência, animação e camada superior (z-index)
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };