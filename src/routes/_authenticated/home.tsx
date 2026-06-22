/* ============================================================================
 *  PÁGINA: /home  —  TELA INICIAL DO APP
 * ----------------------------------------------------------------------------
 *  É a primeira tela depois que o usuário faz login. Mostra:
 *    1) cabeçalho com o logo Nuppy
 *    2) barra de busca
 *    3) destaques (Adoção, Veterinário, Pet Shop) — cards coloridos
 *    4) card "Estabelecimentos pet"
 *    5) seção de pets para adoção (vinda do banco de dados)
 *
 *  👉 GUIA RÁPIDO:
 *    • Trocar o LOGO no topo            → componente <NuppyLogo /> (linha ~75)
 *    • Mudar o texto "Onde todo animal…"→ linha ~78
 *    • Adicionar/remover CATEGORIA      → array `categories` (linha ~33)
 *    • Mudar a COR dos cards categoria  → propriedade `bg` (gradiente Tailwind)
 *    • Mudar o ícone do MICROFONE       → componente <Mic /> linha ~92
 *    • Mexer no botão "Ver tudo"        → linha ~117
 * ========================================================================== */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Mic, Heart, MapPin } from "lucide-react";
import { Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NuppyLogo } from "@/components/NuppyLogo";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Início — Nuppy" }] }),  // título que aparece na aba do navegador
  component: HomePage,
});

/* ----------------------------------------------------------------------------
 * CATEGORIAS DE DESTAQUE (cards grandes no topo)
 *  - label : texto que aparece no canto inferior do card
 *  - emoji : ícone grande do card
 *  - bg    : GRADIENTE de fundo (formato Tailwind: from-COR-INTENSIDADE to-COR-INTENSIDADE)
 *            Ex.: "from-pink-200 to-orange-100" = rosa → laranja
 * -------------------------------------------------------------------------- */
const categories = [
  { label: "Adoção",      emoji: "🐾", bg: "from-pink-200 to-orange-100" },
  { label: "Veterinário", emoji: "🩺", bg: "from-amber-200 to-orange-100" },
  { label: "Pet Shop",    emoji: "🛍️", bg: "from-sky-200 to-amber-100"  },
] as const;

function HomePage() {
  return (
    // MobileShell = "moldura" do app (centraliza e coloca a BottomNav embaixo)
    <MobileShell>
      {/* ============== CABEÇALHO COM LOGO ============== */}
      <header className="relative pt-4 pb-2 px-4">
        <div className="flex justify-center">
          {/* 🐾 LOGO Nuppy. Pra trocar a imagem: edite src/components/NuppyLogo.tsx */}
          <NuppyLogo className="h-32 drop-shadow-sm" />
        </div>

        {/* 🏷️ "Etiquetinha" laranja com o slogan, ligeiramente sobreposta ao logo */}
        <div className="-mt-6 flex justify-center">
          <span className="rounded-full bg-primary text-primary-foreground text-xs font-display px-4 py-1.5 shadow-soft">
            {/* 👇 TEXTO DO SLOGAN — troque aqui pra mudar a frase */}
            Onde todo animal encontra cuidado.
          </span>
        </div>
      </header>

      {/* ============== BARRA DE BUSCA ============== */}
      <div className="px-4 mt-4">
        <label className="relative block">
          {/* 🔍 ícone da lupa (lado esquerdo) */}
          <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />

          {/* CAMPO de texto onde o usuário digita */}
          <input
            placeholder="Buscar..."
            className="w-full rounded-full bg-card border border-border pl-11 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* 🎤 BOTÃO REDONDO DO MICROFONE (laranja, à direita)
              Pra mudar a cor do botão: troque `bg-primary` por `bg-love`, etc. */}
          <button className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-primary grid place-items-center text-primary-foreground">
            <Mic className="size-4" />
          </button>
        </label>
      </div>

      {/* ============== SEÇÃO DESTAQUE (3 cards) ============== */}
      <section className="px-4 mt-6">
        {/* TÍTULO da seção. `text-brand` = marrom-chocolate da paleta Nuppy */}
        <h2 className="font-display text-lg text-brand mb-2">Destaque</h2>

        {/* Grade de 3 colunas igualmente divididas (grid-cols-3) */}
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <Link
              key={c.label}
              to="/estabelecimentos"
              className={
                // 👇 AQUI o gradiente de cor do card vem da `c.bg`
                `rounded-2xl bg-gradient-to-br ${c.bg} aspect-square flex flex-col items-end p-2 shadow-card hover:scale-[1.02] transition`
              }
            >
              <span className="text-3xl ml-auto">{c.emoji}</span>
              <span className="mt-auto font-display text-sm text-brand">{c.label}</span>
            </Link>
          ))}
        </div>

        {/* CARD GRANDE de "Estabelecimentos pet" (logo abaixo das 3 categorias) */}
        <Link
          to="/estabelecimentos"
          className="mt-3 nuppy-card p-4 flex items-center justify-between hover:shadow-soft transition"
        >
          <div>
            <p className="font-display text-brand">Estabelecimentos pet</p>
            <p className="text-xs text-muted-foreground">ONGs, banho, hotéis, alimentação e mais</p>
          </div>
          <span className="text-2xl">🏪</span>
        </Link>
      </section>

      {/* ============== ADOÇÃO DE PETS ============== */}
      <section className="px-4 mt-6">
        <div className="nuppy-card p-4">
          {/* Cabeçalho do card: título à esquerda + link "Ver tudo" à direita */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐾</span>
              <h2 className="font-display text-lg text-brand">Adoção de Pets</h2>
            </div>
            {/* 👉 LINK "Ver tudo" — leva pro feed social.
                 Cor laranja vem de `text-primary`. */}
            <Link to="/social" className="text-sm font-display text-primary">
              Ver tudo →
            </Link>
          </div>

          {/* Suspense = enquanto carrega do banco, mostra esqueletos cinzas pulsando */}
          <Suspense fallback={<div className="h-40 mt-3 grid grid-cols-2 gap-3"><Skel /><Skel /></div>}>
            <PetsForAdoption />
          </Suspense>
        </div>
      </section>
    </MobileShell>
  );
}

/* "Esqueletinho" cinza que pulsa enquanto os dados ainda estão chegando */
function Skel() {
  return <div className="rounded-2xl bg-muted animate-pulse" />;
}

/* ----------------------------------------------------------------------------
 * BUSCA DOS PETS NO BANCO DE DADOS
 *  - tabela: `pets`
 *  - pega os 6 mais recentes
 *  - mostra só os 2 primeiros na home (resto fica pro /social)
 * -------------------------------------------------------------------------- */
const adoptionQuery = {
  queryKey: ["adoption-pets"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("pets")
      .select("id, name, age, city, photo_url")
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return data ?? [];
  },
};

function PetsForAdoption() {
  const { data } = useSuspenseQuery(adoptionQuery);

  // SE NÃO TEM NENHUM PET cadastrado, mostra mensagem amigável
  if (data.length === 0) {
    return (
      <div className="mt-3 rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">
        Nenhum pet cadastrado ainda.{" "}
        <Link to="/perfil" className="text-primary font-display">Cadastre o seu →</Link>
      </div>
    );
  }

  return (
    // Grade de 2 cards lado a lado
    <div className="mt-3 grid grid-cols-2 gap-3">
      {data.slice(0, 2).map((pet) => (
        <Link
          key={pet.id}
          to="/pet/$petId"
          params={{ petId: pet.id }}
          className="rounded-2xl bg-accent p-2 relative block"
        >
          {/* FOTO do pet (quadrada). Se não tiver foto, mostra emoji 🐶 */}
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full grid place-items-center text-4xl">🐶</div>
            )}
          </div>

          {/* ❤️ CORAÇÃO ROSA no canto superior direito (cor `text-love`) */}
          <Heart className="size-5 absolute top-3 right-3 text-love fill-love" />

          {/* INFO embaixo da foto: nome + idade + cidade */}
          <div className="mt-2 px-1">
            <p className="font-display text-brand">{pet.name}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-between">
              <span>{pet.age ?? "—"}</span>
              {pet.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {pet.city}
                </span>
              )}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
