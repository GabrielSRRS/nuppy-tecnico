
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_messages TO authenticated;
GRANT ALL ON public.community_messages TO service_role;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read messages" ON public.community_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.community_members m WHERE m.community_id = community_messages.community_id AND m.user_id = auth.uid()));

CREATE POLICY "members send messages" ON public.community_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.community_members m WHERE m.community_id = community_messages.community_id AND m.user_id = auth.uid()));

CREATE POLICY "author deletes own message" ON public.community_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX community_messages_community_created_idx ON public.community_messages (community_id, created_at);

-- Seed default communities (idempotent on slug)
INSERT INTO public.communities (name, slug, description, emoji, created_by)
SELECT 'Cachorros', 'cachorros', 'Comunidade dos tutores de cães. Compartilhe dicas, fotos e experiências!', '🐶', (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE slug = 'cachorros')
  AND EXISTS (SELECT 1 FROM auth.users);

INSERT INTO public.communities (name, slug, description, emoji, created_by)
SELECT 'Gatos', 'gatos', 'Para amantes de felinos. Miados, brincadeiras e cuidados.', '🐱', (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE slug = 'gatos')
  AND EXISTS (SELECT 1 FROM auth.users);

INSERT INTO public.communities (name, slug, description, emoji, created_by)
SELECT 'Peixes', 'peixes', 'Aquaristas unidos! Dicas de aquários, espécies e manutenção.', '🐠', (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE slug = 'peixes')
  AND EXISTS (SELECT 1 FROM auth.users);
