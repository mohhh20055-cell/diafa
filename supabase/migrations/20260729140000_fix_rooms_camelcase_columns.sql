-- Migration to handle camelCase columns on the 'rooms' table
DO $$ 
BEGIN
    -- If column "nomType" exists, rename to "nom_type" or set default/nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'nomType'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'nom_type'
        ) THEN
            ALTER TABLE public.rooms RENAME COLUMN "nomType" TO nom_type;
        ELSE
            ALTER TABLE public.rooms ALTER COLUMN "nomType" DROP NOT NULL;
        END IF;
    END IF;

    -- If column "prixNuit" exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'prixNuit'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'prix_nuit'
        ) THEN
            ALTER TABLE public.rooms RENAME COLUMN "prixNuit" TO prix_nuit;
        ELSE
            ALTER TABLE public.rooms ALTER COLUMN "prixNuit" DROP NOT NULL;
        END IF;
    END IF;

    -- If column "nbDisponible" exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'nbDisponible'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'nb_disponible'
        ) THEN
            ALTER TABLE public.rooms RENAME COLUMN "nbDisponible" TO nb_disponible;
        ELSE
            ALTER TABLE public.rooms ALTER COLUMN "nbDisponible" DROP NOT NULL;
        END IF;
    END IF;
END $$;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
