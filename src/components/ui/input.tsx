import * as React from "react";

import { cn } from "@/lib/utils";

/*
  Input
  - Componente leve que encapsula um <input> padrão do HTML e aplica estilos do design system.
  - Usa forwardRef para permitir que componentes pais acessem a ref do input (ex.: para foco programático).
  - Mantém todas as props nativas de <input>, portanto pode ser usado como um campo controlado
    ou não-controlado dependendo do uso.

  Boas práticas:
  - Evite passar diretamente `value` sem `onChange` (ou será um input somente leitura).
  - Exemplo de uso: <Input placeholder="Digite seu nome" />
*/
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };