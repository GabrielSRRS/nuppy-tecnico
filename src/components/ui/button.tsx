"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
  buttonVariants
  - Utiliza `class-variance-authority` (cva) para definir um conjunto de classes compartilhadas
    e variantes (variant, size) que o componente Button pode receber.
  - Isso permite trocar rapidamente aparências (ex.: default, destructive, outline) e tamanhos
    mantendo a API consistente.
  - A string principal contém classes utilitárias do Tailwind que aplicam o estilo base do botão.

  Observação: Essa constante é puramente de estilo; não altera comportamento do componente.
*/
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring-color)]",
  {
    variants: {
      variant: {
        // Variante padrão: botão com cor primária do design system
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        // Variante destrutiva: para ações perigosas (ex.: deletar)
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        // Variante outline: botão com borda, fundo transparente
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Tamanhos suportados pelo componente — afetam paddings/altura
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/*
  ButtonProps
  - Extende as props nativas de um <button> e adiciona as variantes do cva.
  - asChild?: permite renderizar outro elemento no lugar do botão (ex.: um Link do Next.js),
    útil quando precisamos da semântica de um link mas do estilo do botão.
*/
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/*
  Button (com forwardRef)
  - Componente reutilizável de botão que aplica as classes geradas por `buttonVariants`.
  - Usa `Slot` (Radix) quando `asChild` é true — permitindo trocar o elemento sem perder as
    classes/estilos (útil para integrações com roteadores).
  - Mantém a ref do elemento para que o consumidor possa focar/medir o botão quando necessário.

  A lógica é mínima: apenas escolhe o elemento a renderizar e aplica classes.
*/
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };