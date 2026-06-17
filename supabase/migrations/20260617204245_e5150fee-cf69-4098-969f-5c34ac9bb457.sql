
-- COMMUNITIES
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  emoji TEXT DEFAULT '🐾',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.communities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communities viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Authenticated can create" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update" ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete" ON public.communities FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
GRANT SELECT ON public.community_members TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by everyone" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join" ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PLACES (pet friendly)
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  phone TEXT,
  photo_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.places TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.places TO authenticated;
GRANT ALL ON public.places TO service_role;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Places viewable by everyone" ON public.places FOR SELECT USING (true);
CREATE POLICY "Authenticated can add places" ON public.places FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update place" ON public.places FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete place" ON public.places FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- SERVICES (divulgação)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price_range TEXT,
  city TEXT,
  whatsapp TEXT,
  instagram TEXT,
  photo_url TEXT,
  provider_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Authenticated can post service" ON public.services FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Provider can update service" ON public.services FOR UPDATE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Provider can delete service" ON public.services FOR DELETE TO authenticated USING (auth.uid() = provider_id);

-- Triggers updated_at
CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_places_updated BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for buckets (buckets created via tool separately)
CREATE POLICY "Public read media" ON storage.objects FOR SELECT USING (bucket_id IN ('pet-photos','post-media','place-photos','service-photos'));
CREATE POLICY "Auth can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('pet-photos','post-media','place-photos','service-photos') AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth can update own media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('pet-photos','post-media','place-photos','service-photos') AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth can delete own media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('pet-photos','post-media','place-photos','service-photos') AND (auth.uid())::text = (storage.foldername(name))[1]);
