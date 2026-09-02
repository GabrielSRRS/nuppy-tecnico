-- Nuppy: garantir que o cadastro do Auth crie um perfil completo.
-- Esta migration é segura para aplicar em projetos que já possuem a tabela profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  base_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  IF base_username = '' THEN
    base_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;

  final_username := left(base_username, 24);
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := left(base_username, greatest(1, 24 - length(counter::text))) || counter::text;
  END LOOP;

  INSERT INTO public.profiles (
    id, username, display_name, bio, city, avatar_url
  )
  VALUES (
    NEW.id,
    final_username,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      final_username
    ),
    NEW.raw_user_meta_data->>'bio',
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    city = COALESCE(EXCLUDED.city, public.profiles.city),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  RETURN NEW;
END;
$$;

-- Garante que o trigger exista mesmo se uma instalação anterior o removeu.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Recria os perfis que ficaram sem registro por causa de instalações antigas.
-- Usa o mesmo algoritmo de username único do trigger para respeitar a coluna UNIQUE.
DO $$
DECLARE
  u RECORD;
  base_username TEXT;
  final_username TEXT;
  counter INT;
BEGIN
  FOR u IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.users.id)
  LOOP
    base_username := COALESCE(
      NULLIF(u.raw_user_meta_data->>'username', ''),
      split_part(COALESCE(u.email, ''), '@', 1),
      'user_' || substr(u.id::text, 1, 8)
    );
    base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
    IF base_username = '' THEN
      base_username := 'user_' || substr(u.id::text, 1, 8);
    END IF;

    final_username := left(base_username, 24);
    counter := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      counter := counter + 1;
      final_username := left(base_username, greatest(1, 24 - length(counter::text))) || counter::text;
    END LOOP;

    INSERT INTO public.profiles (id, username, display_name, city, avatar_url)
    VALUES (
      u.id,
      final_username,
      COALESCE(NULLIF(u.raw_user_meta_data->>'display_name', ''), NULLIF(u.raw_user_meta_data->>'full_name', ''), final_username),
      NULLIF(u.raw_user_meta_data->>'city', ''),
      NULLIF(u.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Para perfis já existentes, aproveita cidade/nome do metadata quando disponíveis.
UPDATE public.profiles p
SET
  display_name = COALESCE(NULLIF(u.raw_user_meta_data->>'display_name', ''), NULLIF(u.raw_user_meta_data->>'full_name', ''), p.display_name),
  city = COALESCE(p.city, NULLIF(u.raw_user_meta_data->>'city', '')),
  avatar_url = COALESCE(p.avatar_url, NULLIF(u.raw_user_meta_data->>'avatar_url', ''))
FROM auth.users u
WHERE u.id = p.id;

-- O trigger é SECURITY DEFINER; usuários comuns não precisam executar a função diretamente.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
