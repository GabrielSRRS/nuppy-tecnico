
-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Places: only admins can write
ALTER TABLE public.places ALTER COLUMN created_by DROP NOT NULL;

DROP POLICY IF EXISTS "Authenticated can add places" ON public.places;
DROP POLICY IF EXISTS "Creator can delete place" ON public.places;
DROP POLICY IF EXISTS "Creator can update place" ON public.places;

CREATE POLICY "Admins can add places" ON public.places
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update places" ON public.places
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete places" ON public.places
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed sample establishments (São Paulo)
INSERT INTO public.places (name, category, description, address, city, lat, lng, phone, photo_url, created_by)
VALUES
 ('Ampara Animal','ONG','Maior organização de proteção animal do Brasil. Atuamos pela defesa dos direitos e respeito aos animais.','R. Doutor Renato Paes de Barros, 33','São Paulo',-23.5779,-46.6712,'(11) 3078-0900',NULL,NULL),
 ('UIPA','ONG','Organização não governamental de proteção animal mais antiga do Brasil.','R. Vergueiro, 434','São Paulo',-23.5650,-46.6420,'(11) 3209-3338',NULL,NULL),
 ('Sinergia Animal','ONG','Organização internacional de proteção animal contra práticas industriais.','Av. Paulista, 1471','São Paulo',-23.5613,-46.6560,'(11) 4280-6000',NULL,NULL),
 ('Instituto Caramelo','ONG','Resgate, reabilitação e adoção de cães e gatos em situação de rua.','R. Cardeal Arcoverde, 1145','São Paulo',-23.5588,-46.6890,'(11) 3814-1900',NULL,NULL),
 ('Pet Spa Beauty','Banho','Banho e tosa premium com produtos hipoalergênicos.','R. Augusta, 2400','São Paulo',-23.5570,-46.6630,'(11) 3061-0220',NULL,NULL),
 ('Cão Limpo','Banho','Banho expresso, tosa higiênica e hidratação.','Av. Brigadeiro Faria Lima, 1500','São Paulo',-23.5760,-46.6900,'(11) 3815-7700',NULL,NULL),
 ('Pet Hotel Carinho','Hotel','Hospedagem para cães e gatos com monitoramento 24h e área externa.','Rod. Raposo Tavares, km 22','São Paulo',-23.5980,-46.7800,'(11) 3782-1010',NULL,NULL),
 ('Resort Pet Paulista','Hotel','Hotel pet com piscina, day care e transporte.','Av. Sumaré, 1000','São Paulo',-23.5410,-46.6740,'(11) 3672-4400',NULL,NULL),
 ('Ração & Cia','Alimentação','Loja especializada em rações naturais e premium para cães e gatos.','R. Teodoro Sampaio, 800','São Paulo',-23.5560,-46.6810,'(11) 3081-3030',NULL,NULL),
 ('Cozinha Pet','Alimentação','Alimentação natural congelada para pets, entrega em SP.','R. Harmonia, 220','São Paulo',-23.5470,-46.6920,'(11) 3032-8800',NULL,NULL),
 ('Clínica VetLife','Veterinário','Clínica veterinária 24h com cirurgia, internação e exames.','Av. Rebouças, 1500','São Paulo',-23.5670,-46.6790,'(11) 3061-9000',NULL,NULL),
 ('Parque Ibirapuera Pet','Parque','Área pet friendly no Parque Ibirapuera para passeios e socialização.','Av. Pedro Álvares Cabral, s/n','São Paulo',-23.5874,-46.6576,NULL,NULL,NULL);
