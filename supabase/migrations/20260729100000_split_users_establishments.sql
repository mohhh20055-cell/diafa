-- 1. Create establishments table if it does not exist, or ensure the columns are correct.
-- If the establishments table already exists, we will insert missing data from users.
-- We will use the user id as the establishment id for existing users to preserve relationships.

INSERT INTO public.establishments (id, owner_id, nom, type, wilaya, ville, adresse, description, images, image_vedette, statut_validation, actif, created_at, updated_at)
SELECT 
    u.id, 
    u.id as owner_id, 
    COALESCE(u."nomEtablissement", u.nometablissement, 'Établissement ' || u.nom || ' ' || u.prenom), 
    COALESCE(u."typeEtablissement", u.typeetablissement, 'hotel'), 
    COALESCE(u.wilaya, 'Alger'), 
    COALESCE(u.ville, 'Alger'), 
    COALESCE(u.adresse, u.ville, 'Alger'), 
    COALESCE(u.description, 'Établissement ' || u.nom), 
    COALESCE(u.images, '[]'::jsonb), 
    COALESCE(u."imageVedette", u.imagevedette), 
    COALESCE(u."statutValidation", u.statutvalidation, 'en_attente'), 
    COALESCE(u.actif, false), 
    COALESCE(u."createdAt", now()), 
    COALESCE(u."updatedAt", now())
FROM public.users u
WHERE u.role = 'owner'
ON CONFLICT (id) DO NOTHING;

-- 2. Drop columns from users table
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
