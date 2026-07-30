/*
# Diyafa - Complete Database Schema

## Overview
Creates the full schema for the Diyafa accommodation booking platform (Algeria).
This migration creates all tables, relationships, RLS policies, and a trigger to
automatically create a profile row whenever a new auth user signs up.

## New Tables

1. `profiles`
   - Mirrors auth.users. Stores the public user info: name, surname, email, phone, role, status.
   - `id` references `auth.users(id)` (1:1). PK = auth user id.
   - `role`: 'client' | 'owner' | 'admin' (default 'client').
   - `statut`: 'actif' | 'bloque' (default 'actif').
   - `telephone`: unique phone number used for login-by-phone.

2. `establishments`
   - Accommodation listings (hotels, dormitories, houses) owned by an owner profile.
   - `owner_id` -> profiles.id.
   - `type`: 'hotel' | 'mraqed' | 'maison'.
   - `statut_validation`: 'en_attente' | 'valide' | 'refuse'.
   - `actif`: boolean visibility flag.
   - `images`: text[] of image URLs. `image_vedette`: featured image URL.
   - `services`: text[] of amenity labels.
   - `latitude`/`longitude`: numeric coordinates (nullable).

3. `rooms`
   - Room/place types within an establishment.
   - `establishment_id` -> establishments.id (CASCADE).
   - `nom_type`: room type name. `prix_nuit`: numeric price per night.
   - `capacite`: max guests. `nb_disponible`: available count.
   - `images`: text[]. `actif`: boolean.

4. `reservations`
   - Booking requests from a client for a room in an establishment.
   - `client_id` -> profiles.id, `establishment_id` -> establishments.id, `room_id` -> rooms.id.
   - `date_debut`/`date_fin`: stay dates. `nb_personnes`: guest count.
   - `prix_total`: numeric. `statut`: 'pending'|'accepted'|'rejected'|'cancelled'|'completed'.
   - `motif_refus`: optional refusal reason.

5. `notifications`
   - Per-user notifications (reservation updates, etc.).
   - `user_id` -> profiles.id. `message`: text. `type`: notification category.
   - `lu`: boolean read flag (default false).

6. `contacts`
   - Contact form submissions from the public site.
   - `nom`, `email`, `sujet`, `message`, `type`.

## Security (RLS)
- profiles: each authenticated user can SELECT/UPDATE their own row. Admins (role='admin') can SELECT all. Anon can SELECT by telephone (for login lookup only).
- establishments: public SELECT for validated+active listings; owners can CRUD their own; admins can SELECT all.
- rooms: public SELECT for rooms in validated establishments; owners can CRUD rooms in their establishments.
- reservations: clients see/manage their own; owners see/manage reservations for their establishments; admins see all.
- notifications: each user sees/updates only their own.
- contacts: anyone (anon+authenticated) can INSERT; only admins can SELECT.

## Trigger
- `handle_new_user`: AFTER INSERT on auth.users -> inserts a profiles row using metadata from the signup options (nom, prenom, telephone, role).
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT '',
  prenom text NOT NULL DEFAULT '',
  email text,
  telephone text UNIQUE,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client','owner','admin')),
  statut text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','bloque')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "select_profile_by_telephone_anon" ON profiles;
CREATE POLICY "select_profile_by_telephone_anon" ON profiles FOR SELECT
  TO anon, authenticated USING (telephone IS NOT NULL AND telephone = current_setting('request.telephone', true));

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================
-- ESTABLISHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type text NOT NULL DEFAULT 'hotel' CHECK (type IN ('hotel','mraqed','maison')),
  wilaya text,
  ville text,
  adresse text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  description text,
  services text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  image_vedette text,
  statut_validation text NOT NULL DEFAULT 'en_attente' CHECK (statut_validation IN ('en_attente','valide','refuse')),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_establishments_owner ON establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_establishments_type ON establishments(type);
CREATE INDEX IF NOT EXISTS idx_establishments_ville ON establishments(ville);
CREATE INDEX IF NOT EXISTS idx_establishments_statut ON establishments(statut_validation);

ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_validated_establishments" ON establishments;
CREATE POLICY "public_select_validated_establishments" ON establishments FOR SELECT
  TO anon, authenticated USING (actif = true AND statut_validation = 'valide');

DROP POLICY IF EXISTS "owner_select_own_establishments" ON establishments;
CREATE POLICY "owner_select_own_establishments" ON establishments FOR SELECT
  TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "admin_select_all_establishments" ON establishments;
CREATE POLICY "admin_select_all_establishments" ON establishments FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "owner_insert_establishments" ON establishments;
CREATE POLICY "owner_insert_establishments" ON establishments FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "owner_update_establishments" ON establishments;
CREATE POLICY "owner_update_establishments" ON establishments FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "admin_update_establishments" ON establishments;
CREATE POLICY "admin_update_establishments" ON establishments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "owner_delete_establishments" ON establishments;
CREATE POLICY "owner_delete_establishments" ON establishments FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  nom_type text NOT NULL,
  prix_nuit numeric(10,2) NOT NULL DEFAULT 0,
  capacite int NOT NULL DEFAULT 1,
  nb_disponible int NOT NULL DEFAULT 1,
  images text[] DEFAULT '{}',
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_establishment ON rooms(establishment_id);

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
CREATE POLICY "admin_select_rooms" ON rooms FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "owner_insert_rooms" ON rooms;
CREATE POLICY "owner_insert_rooms" ON rooms FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM establishments e
      WHERE e.id = establishment_id AND e.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner_update_rooms" ON rooms;
CREATE POLICY "owner_update_rooms" ON rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM establishments e WHERE e.id = rooms.establishment_id AND e.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM establishments e WHERE e.id = rooms.establishment_id AND e.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_delete_rooms" ON rooms;
CREATE POLICY "owner_delete_rooms" ON rooms FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM establishments e WHERE e.id = rooms.establishment_id AND e.owner_id = auth.uid())
  );

-- ============================================================
-- RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  nb_personnes int NOT NULL DEFAULT 1,
  prix_total numeric(10,2) NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending','accepted','rejected','cancelled','completed')),
  motif_refus text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_client ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_establishment ON reservations(establishment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);

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
CREATE POLICY "admin_select_all_reservations" ON reservations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

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
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

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
-- CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email text NOT NULL,
  sujet text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'contact',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contacts" ON contacts;
CREATE POLICY "anon_insert_contacts" ON contacts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_contacts" ON contacts;
CREATE POLICY "admin_select_contacts" ON contacts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

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
  INSERT INTO public.profiles (id, email, nom, prenom, telephone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'telephone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
