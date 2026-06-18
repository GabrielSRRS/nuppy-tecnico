
-- 1. Add FK from community_messages.user_id to profiles for PostgREST embedding
ALTER TABLE public.community_messages
  ADD CONSTRAINT community_messages_user_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Enable realtime on community_messages
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- 3. Comments on posts
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated reads comments" ON public.post_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "user inserts own comment" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "author deletes own comment" ON public.post_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.post_comments
  ADD CONSTRAINT post_comments_user_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX post_comments_post_created_idx ON public.post_comments(post_id, created_at);
