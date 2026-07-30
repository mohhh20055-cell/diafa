-- Migration to ensure all required columns exist on the 'rooms' table and refresh schema cache
DO $$ 
BEGIN
    -- Ensure establishment_id column exists or rename etablissement_id if it exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'establishment_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'etablissement_id'
        ) THEN
            ALTER TABLE public.rooms RENAME COLUMN etablissement_id TO establishment_id;
        ELSE
            ALTER TABLE public.rooms ADD COLUMN establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Ensure created_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    -- Ensure nom_type exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'nom_type'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN nom_type text DEFAULT 'Chambre Standard';
    END IF;

    -- Ensure prix_nuit exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'prix_nuit'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN prix_nuit numeric(10,2) DEFAULT 5000;
    END IF;

    -- Ensure capacite exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'capacite'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN capacite integer DEFAULT 1;
    END IF;

    -- Ensure nb_disponible exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'nb_disponible'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN nb_disponible integer DEFAULT 1;
    END IF;

    -- Ensure images exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'images'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
    END IF;

    -- Ensure actif exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'actif'
    ) THEN
        ALTER TABLE public.rooms ADD COLUMN actif boolean DEFAULT true;
    END IF;

END $$;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
