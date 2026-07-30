CREATE TABLE IF NOT EXISTS public.establishments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nom text NOT NULL,
    type text NOT NULL CHECK (type IN ('hotel','mraqed')),
    wilaya text NOT NULL,
    ville text NOT NULL,
    adresse text NOT NULL,
    description text,
    services jsonb NOT NULL DEFAULT '[]'::jsonb,
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    image_vedette text,
    statut_validation text NOT NULL DEFAULT 'en_attente' CHECK (statut_validation IN ('en_attente','valide','refuse')),
    actif boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "establishments_select_all" ON public.establishments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "establishments_insert_owner" ON public.establishments FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "establishments_update_owner" ON public.establishments FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "establishments_delete_owner" ON public.establishments FOR DELETE TO authenticated USING (auth.uid() = owner_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Migrate data
INSERT INTO public.establishments (id, owner_id, nom, type, wilaya, ville, adresse, description, images, image_vedette, statut_validation, actif)
SELECT 
    u.id, 
    u.id as owner_id, 
    COALESCE(u."nomEtablissement", u.nometablissement, 'Établissement ' || u.nom || ' ' || u.prenom), 
    COALESCE(u."typeEtablissement", u.typeetablissement, 'hotel'), 
    COALESCE(u.wilaya, 'Alger'), 
    COALESCE(u.ville, 'Alger'), 
    COALESCE(u.adresse, u.ville, 'Alger'), 
    COALESCE(u.description, 'Établissement ' || u.nom), 
    to_jsonb(COALESCE(u.images, ARRAY[]::text[])), 
    COALESCE(u."imageVedette", u.imagevedette), 
    COALESCE(u."statutValidation", u.statutvalidation, 'en_attente'), 
    COALESCE(u.actif, false)
FROM public.users u
WHERE u.role = 'owner'
ON CONFLICT (id) DO NOTHING;

-- Drop columns from users table
ALTER TABLE public.users
DROP COLUMN IF EXISTS "nomEtablissement",
DROP COLUMN IF EXISTS "typeEtablissement",
DROP COLUMN IF EXISTS wilaya,
DROP COLUMN IF EXISTS ville,
DROP COLUMN IF EXISTS adresse,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS images,
DROP COLUMN IF EXISTS "imageVedette",
DROP COLUMN IF EXISTS "statutValidation",
DROP COLUMN IF EXISTS actif,
DROP COLUMN IF EXISTS nometablissement,
DROP COLUMN IF EXISTS typeetablissement,
DROP COLUMN IF EXISTS statutvalidation,
DROP COLUMN IF EXISTS imagevedette;
