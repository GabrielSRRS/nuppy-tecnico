
-- 1) services column on places (array of offered services)
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}';

-- 2) place_photos (carousel)
CREATE TABLE IF NOT EXISTS public.place_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS place_photos_place_idx ON public.place_photos(place_id, position);

GRANT SELECT ON public.place_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.place_photos TO authenticated;
GRANT ALL ON public.place_photos TO service_role;

ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Place photos viewable by everyone" ON public.place_photos FOR SELECT USING (true);
CREATE POLICY "Admins manage place photos ins" ON public.place_photos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage place photos upd" ON public.place_photos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage place photos del" ON public.place_photos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3) place_reviews
CREATE TABLE IF NOT EXISTS public.place_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id, user_id)
);
CREATE INDEX IF NOT EXISTS place_reviews_place_idx ON public.place_reviews(place_id, created_at DESC);

GRANT SELECT ON public.place_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.place_reviews TO authenticated;
GRANT ALL ON public.place_reviews TO service_role;

ALTER TABLE public.place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.place_reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own review" ON public.place_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review" ON public.place_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own review" ON public.place_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_place_reviews_updated BEFORE UPDATE ON public.place_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
