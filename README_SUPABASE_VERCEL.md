# Nuppy — Supabase + Vercel

## 1. Banco de dados

As tabelas do Nuppy já estão descritas em `supabase/migrations/`. Para uma instalação nova, aplique todas as migrations em ordem.

A migration `20260902090000_fix_profiles_signup_city.sql` corrige o cadastro: o trigger `on_auth_user_created` cria automaticamente o registro em `public.profiles` usando os dados enviados em `signUp()` (`username`, `display_name`, `city` e `avatar_url`).

No Supabase, você pode aplicar as migrations pelo Supabase CLI ou pelo fluxo de migrations do seu projeto. Não coloque a `service_role` key no frontend.

## 2. Variáveis da Vercel

Em **Vercel > Project > Settings > Environment Variables**, configure pelo menos:

- `VITE_SUPABASE_URL` = URL do projeto Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` = chave pública/publishable do Supabase
- `SUPABASE_URL` = mesma URL
- `SUPABASE_PUBLISHABLE_KEY` = mesma chave pública/publishable

`SUPABASE_SERVICE_ROLE_KEY` só deve existir no ambiente de servidor se alguma função server-side realmente precisar dela. Nunca use essa chave em código client-side.

Depois de alterar as variáveis, faça um novo deploy/redeploy.

## 3. Fluxo do cadastro

```text
Tela /auth
   ↓
supabase.auth.signUp()
   ↓
Supabase Auth (auth.users)
   ↓
trigger on_auth_user_created
   ↓
public.profiles
   ↓
/home
```

Se a confirmação de e-mail estiver ativada no Supabase, o usuário precisa confirmar o e-mail antes de existir uma sessão no navegador. O perfil, porém, é criado pelo trigger no banco no momento em que o usuário é criado.
