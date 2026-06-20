
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS birthdate DATE,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS neutered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vaccinated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS microchip TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS medical_notes TEXT,
  ADD COLUMN IF NOT EXISTS favorite_food TEXT,
  ADD COLUMN IF NOT EXISTS favorite_toy TEXT,
  ADD COLUMN IF NOT EXISTS personality TEXT,
  ADD COLUMN IF NOT EXISTS adopted_at DATE,
  ADD COLUMN IF NOT EXISTS vet_name TEXT,
  ADD COLUMN IF NOT EXISTS vet_phone TEXT;

ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE public.community_messages ALTER COLUMN body DROP NOT NULL;

DROP POLICY IF EXISTS "community media read" ON storage.objects;
CREATE POLICY "community media read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-media');

DROP POLICY IF EXISTS "community media insert own" ON storage.objects;
CREATE POLICY "community media insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "community media delete own" ON storage.objects;
CREATE POLICY "community media delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);
