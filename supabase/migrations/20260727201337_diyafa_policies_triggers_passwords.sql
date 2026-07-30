-- ============================================================
-- Ensure all RLS policies, functions, and triggers are in place
-- (Schema tables already exist; this only adds/fixes policies + triggers)
-- ============================================================

-- ============================================================
-- IS_ADMIN helper (SECURITY DEFINER, avoids RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- ============================================================
-- PROFILES policies
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "select_profile_by_telephone_anon" ON profiles;
CREATE POLICY "select_profile_by_telephone_anon" ON profiles FOR SELECT
  TO anon, authenticated USING (telephone IS NOT NULL);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile_anon" ON profiles;
CREATE POLICY "insert_own_profile_anon" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ESTABLISHMENTS policies
-- ============================================================
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_validated_establishments" ON establishments;
CREATE POLICY "public_select_validated_establishments" ON establishments FOR SELECT
  TO anon, authenticated USING (actif = true AND statut_validation = 'valide');

DROP POLICY IF EXISTS "owner_select_own_establishments" ON establishments;
CREATE POLICY "owner_select_own_establishments" ON establishments FOR SELECT
  TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "admin_select_all_establishments" ON establishments;
CREATE POLICY "admin_select_all_establishments"
  ON establishments FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "owner_insert_establishments" ON establishments;
CREATE POLICY "owner_insert_establishments" ON establishments FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "owner_update_establishments" ON establishments;
CREATE POLICY "owner_update_establishments" ON establishments FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "admin_update_establishments" ON establishments;
CREATE POLICY "admin_update_establishments"
  ON establishments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "owner_delete_establishments" ON establishments;
CREATE POLICY "owner_delete_establishments" ON establishments FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

-- ============================================================
-- ROOMS policies
-- ============================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_rooms_validated" ON rooms;
CREATE POLICY "public_select_rooms_validated" ON rooms FOR SELECT
  TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM establishments e
      WHERE e.id = rooms.establishment_id
        AND e.actif = true AND e.statut_validation = 'valide'
    )
  );

DROP POLICY IF EXISTS "owner_select_rooms" ON rooms;
CREATE POLICY "owner_select_rooms" ON rooms FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM establishments e
      WHERE e.id = rooms.establishment_id AND e.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_select_rooms" ON rooms;
CREATE POLICY "admin_select_rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "owner_insert_rooms" ON rooms;
CREATE POLICY "owner_insert_rooms" ON rooms FOR INSERT
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

DROP POLICY IF EXISTS "owner_update_rooms" ON rooms;
CREATE POLICY "owner_update_rooms" ON rooms FOR UPDATE
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

DROP POLICY IF EXISTS "owner_delete_rooms" ON rooms;
CREATE POLICY "owner_delete_rooms" ON rooms FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM establishments e WHERE e.id = rooms.establishment_id AND e.owner_id = auth.uid())
  );

-- ============================================================
-- RESERVATIONS policies
-- ============================================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_select_own_reservations" ON reservations;
CREATE POLICY "client_select_own_reservations" ON reservations FOR SELECT
  TO authenticated USING (client_id = auth.uid());

DROP POLICY IF EXISTS "owner_select_reservations" ON reservations;
CREATE POLICY "owner_select_reservations" ON reservations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM establishments e
      WHERE e.id = reservations.establishment_id AND e.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_select_all_reservations" ON reservations;
CREATE POLICY "admin_select_all_reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "client_insert_own_reservations" ON reservations;
CREATE POLICY "client_insert_own_reservations" ON reservations FOR INSERT
  TO authenticated WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "client_update_own_reservations" ON reservations;
CREATE POLICY "client_update_own_reservations" ON reservations FOR UPDATE
  TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "owner_update_reservations" ON reservations;
CREATE POLICY "owner_update_reservations" ON reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM establishments e WHERE e.id = reservations.establishment_id AND e.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM establishments e WHERE e.id = reservations.establishment_id AND e.owner_id = auth.uid())
  );

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- CONTACTS policies
-- ============================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contacts" ON contacts;
CREATE POLICY "anon_insert_contacts" ON contacts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_contacts" ON contacts;
CREATE POLICY "admin_select_contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- REVIEWS policies
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_reviews" ON reviews;
CREATE POLICY "public_select_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON reviews;
CREATE POLICY "insert_own_review" ON reviews FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_review" ON reviews;
CREATE POLICY "update_own_review" ON reviews FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_review" ON reviews;
CREATE POLICY "delete_own_review" ON reviews FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Ensure the aggregate view exists
CREATE OR REPLACE VIEW public.establishment_rating_summary AS
SELECT
  e.id AS establishment_id,
  COALESCE(AVG(r.rating), 0) AS avg_rating,
  COALESCE(COUNT(r.id), 0) AS review_count
FROM public.establishments e
LEFT JOIN public.reviews r ON r.establishment_id = e.id
GROUP BY e.id;

GRANT SELECT ON public.establishment_rating_summary TO anon, authenticated;

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, telephone, role, statut)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'telephone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    'actif'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- NOTIFICATION helper functions + triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_message text,
  p_type text DEFAULT 'general'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (p_user_id, p_message, p_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.profiles WHERE role = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_admins_on_new_establishment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_rec RECORD;
BEGIN
  IF NEW.statut_validation = 'en_attente' THEN
    FOR admin_rec IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
      PERFORM public.create_notification(
        admin_rec.id,
        'Nouvelle demande d''établissement: ' || NEW.nom || ' (' || COALESCE(NEW.ville, '') || ', ' || COALESCE(NEW.wilaya, '') || '). À valider.',
        'establishment_pending'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_establishment_created_notify ON public.establishments;
CREATE TRIGGER on_establishment_created_notify
  AFTER INSERT ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_new_establishment();

CREATE OR REPLACE FUNCTION public.notify_owner_on_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.statut_validation IS DISTINCT FROM NEW.statut_validation) THEN
    IF NEW.statut_validation = 'valide' THEN
      PERFORM public.create_notification(
        NEW.owner_id,
        'Votre établissement "' || NEW.nom || '" a été validé par l''administration. Il est maintenant visible publiquement. Vous pouvez ajouter des chambres.',
        'establishment_validated'
      );
    ELSIF NEW.statut_validation = 'refuse' THEN
      PERFORM public.create_notification(
        NEW.owner_id,
        'Votre établissement "' || NEW.nom || '" a été refusé par l''administration. Veuillez contacter le support pour plus d''informations.',
        'establishment_refused'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_establishment_updated_notify ON public.establishments;
CREATE TRIGGER on_establishment_updated_notify
  AFTER UPDATE ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_validation();

-- ============================================================
-- Update demo user passwords (argon2id hashes)
-- ============================================================
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$yTQ0ltEGszEKLuJDmIDFYA$uVhdXm36/RygWJTQdSdC1AjZTc57oo3pW1Itimm0gUw' WHERE email = 'admin@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$eIalJ/6NawJefNhuWA/W2w$Q1Crha8yDSba04tiq381WMtPadReBOCEMdlq/3ZVNnQ' WHERE email = 'owner@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$Qz972JQXqz6mwT+AJY0gbg$fyX0R93aEozhNiDGRh8JBhI6sVpz140WLJm/iolL/xw' WHERE email = 'client@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$V8nJm9XhoNs0dwTxozDf4g$aOoHUtzQK7riJl0L4DwASvlPeAJjybCUX86xJq5I08g' WHERE email = 'founder@diyafa.dz';

-- Ensure demo users have admin/owner roles in profiles
UPDATE profiles SET role = 'admin' WHERE email = 'admin@diyafa.dz';
UPDATE profiles SET role = 'owner' WHERE email = 'owner@diyafa.dz';
UPDATE profiles SET role = 'client' WHERE email = 'client@diyafa.dz';
UPDATE profiles SET role = 'admin' WHERE email = 'founder@diyafa.dz';

-- Ensure email is confirmed for all demo users
UPDATE auth.users SET email_confirmed_at = now() WHERE email IN ('admin@diyafa.dz', 'owner@diyafa.dz', 'client@diyafa.dz', 'founder@diyafa.dz') AND email_confirmed_at IS NULL;