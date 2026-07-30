-- Ensure client_id exists on reservations table and policies are robust
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'reservations' 
      AND column_name = 'client_id'
  ) THEN
    -- If user_id exists, rename or copy it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'reservations' 
        AND column_name = 'user_id'
    ) THEN
      ALTER TABLE reservations ADD COLUMN client_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
      EXECUTE 'UPDATE reservations SET client_id = user_id WHERE client_id IS NULL';
      ALTER TABLE reservations ALTER COLUMN client_id SET NOT NULL;
    ELSE
      ALTER TABLE reservations ADD COLUMN client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reservations_client ON reservations(client_id);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_select_own_reservations" ON reservations;
CREATE POLICY "client_select_own_reservations" ON reservations FOR SELECT
  TO authenticated USING (client_id = auth.uid() OR client_id = auth.uid());

DROP POLICY IF EXISTS "client_insert_own_reservations" ON reservations;
CREATE POLICY "client_insert_own_reservations" ON reservations FOR INSERT
  TO authenticated WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "client_update_own_reservations" ON reservations;
CREATE POLICY "client_update_own_reservations" ON reservations FOR UPDATE
  TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
