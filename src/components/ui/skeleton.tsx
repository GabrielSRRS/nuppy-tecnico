import { cn } from "@/lib/utils";

/*
  Skeleton
  - Componente visual para exibir um placeholder de carregamento (skeleton) enquanto
    o conteúdo real está sendo buscado ou processado.
  - Ideal para melhorar percepção de performance em locais onde dados demoram a chegar.

  Exemplo de uso:
  - <Skeleton className="h-6 w-32" />
*/
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };