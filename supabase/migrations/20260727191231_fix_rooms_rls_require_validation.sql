-- Fix: only allow owners to insert/update rooms when their establishment is validated
-- This prevents pending owners from adding rooms before admin approval

DROP POLICY IF EXISTS owner_insert_rooms ON rooms;
DROP POLICY IF EXISTS owner_update_rooms ON rooms;

CREATE POLICY owner_insert_rooms ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM establishments e
      WHERE e.id = rooms.establishment_id
        AND e.owner_id = auth.uid()
        AND e.statut_validation = 'valide'
        AND e.actif = true
    )
  );

CREATE POLICY owner_update_rooms ON rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM establishments e
      WHERE e.id = rooms.establishment_id
        AND e.owner_id = auth.uid()
        AND e.statut_validation = 'valide'
        AND e.actif = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM establishments e
      WHERE e.id = rooms.establishment_id
        AND e.owner_id = auth.uid()
        AND e.statut_validation = 'valide'
        AND e.actif = true
    )
  );