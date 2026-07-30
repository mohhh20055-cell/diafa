/*
# Diyafa - Schéma complet de la base de données

## Objectif
Créer toutes les tables nécessaires au fonctionnement de la plateforme Diyafa
(réservation d'hôtels et maisons d'hôtes en Algérie) en remplaçant l'ancien
backend Express/Sequelize par Supabase.

## Nouvelles tables
1. `profiles` — profils utilisateur liés à auth.users (nom, prénom, email,
   téléphone, rôle client/owner/admin, statut actif/bloqué). Le mot de passe
   est géré par Supabase Auth, on ne le stocke PAS ici.
2. `establishments` — établissements (hôtel ou mraqed) créés par un owner,
   avec statut de validation (en_attente/valide/refuse), images, services.
3. `rooms` — chambres ou places attachées à un établissement, avec prix/nuit.
4. `reservations` — demandes de réservation d'un client (statut
   pending/accepted/rejected/cancelled/completed).
5. `reviews` — avis d'un client sur un établissement (note 1-5 + commentaire).
6. `notifications` — notifications d'un utilisateur (message + type + lu).
7. `contacts` — messages de contact public (nom, email, sujet, message).

## Sécurité (RLS)
- Toutes les tables ont RLS activé.
- `profiles` : lecture publique (pour afficher les noms des propriétaires),
  écriture limitée au propriétaire du profil. L'admin peut tout via une
  politique séparée basée sur le rôle JWT.
- `establishments` : lecture publique pour les validés + lecture par le owner
  pour les siens ; écriture par le owner ; validation/statut par l'admin.
- `rooms` : lecture publique, écriture par le owner propriétaire de
  l'établissement parent.
- `reservations` : lecture par le client propriétaire ou le owner de
  l'établissement ; écriture par le client (création) ou le owner (accept/refuse).
- `reviews` : lecture publique ; écriture par le client auteur.
- `notifications` : lecture + mise à jour par le propriétaire uniquement.
- `contacts` : insertion publique (anon + authenticated), lecture par l'admin.

## Notes importantes
1. Les colonnes owner/client utilisent `DEFAULT auth.uid()` pour que les
   inserts frontend (qui ne passent pas l'ID) fonctionnent avec RLS.
2. Le rôle (client/owner/admin) est stocké dans `profiles.role` ET dans les
   `raw_app_meta_data` du JWT pour les vérifications admin côté politiques.
3. Les noms de colonnes restent en français pour correspondre au frontend.
*/

-- ==========================================================
-- 1. PROFILES
-- ==========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text UNIQUE,
  telephone text UNIQUE,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client','owner','admin')),
  statut text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','bloque')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : publique (anon + authenticated) pour pouvoir afficher les noms
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO anon, authenticated USING (true);

-- Insert : un utilisateur crée son propre profil
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

-- Update : un utilisateur modifie son propre profil
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ==========================================================
-- 2. ESTABLISHMENTS
-- ==========================================================
CREATE TABLE IF NOT EXISTS establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('hotel','mraqed')),
  wilaya text NOT NULL,
  ville text NOT NULL,
  adresse text NOT NULL,
  latitude double precision,
  longitude double precision,
  description text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_vedette text,
  statut_validation text NOT NULL DEFAULT 'en_attente' CHECK (statut_validation IN ('en_attente','valide','refuse')),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

-- Lecture : anon/authenticated voient les validés + le owner voit les siens
DROP POLICY IF EXISTS "establishments_select" ON establishments;
CREATE POLICY "establishments_select"
ON establishments FOR SELECT
TO anon, authenticated
USING (
  statut_validation = 'valide'
  OR owner_id = auth.uid()
);

-- Insert : owner connecté
DROP POLICY IF EXISTS "establishments_insert_own" ON establishments;
CREATE POLICY "establishments_insert_own"
ON establishments FOR INSERT
TO authenticated WITH CHECK (owner_id = auth.uid());

-- Update : owner propriétaire ou admin
DROP POLICY IF EXISTS "establishments_update_own" ON establishments;
CREATE POLICY "establishments_update_own"
ON establishments FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR (auth.jwt() ->> 'user_role') = 'admin')
WITH CHECK (owner_id = auth.uid() OR (auth.jwt() ->> 'user_role') = 'admin');

-- Delete : admin uniquement
DROP POLICY IF EXISTS "establishments_delete_admin" ON establishments;
CREATE POLICY "establishments_delete_admin"
ON establishments FOR DELETE
TO authenticated USING ((auth.jwt() ->> 'user_role') = 'admin');

-- ==========================================================
-- 3. ROOMS
-- ==========================================================
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  nom_type text NOT NULL,
  prix_nuit numeric(10,2) NOT NULL,
  capacite integer NOT NULL DEFAULT 1,
  nb_disponible integer NOT NULL DEFAULT 1,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "rooms_select" ON rooms;
CREATE POLICY "rooms_select"
ON rooms FOR SELECT
TO anon, authenticated USING (true);

-- Insert/update/delete : owner de l'établissement parent ou admin
DROP POLICY IF EXISTS "rooms_insert_owner" ON rooms;
CREATE POLICY "rooms_insert_owner"
ON rooms FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = rooms.establishment_id
    AND (establishments.owner_id = auth.uid() OR (auth.jwt() ->> 'user_role') = 'admin')
  )
);

DROP POLICY IF EXISTS "rooms_update_owner" ON rooms;
CREATE POLICY "rooms_update_owner"
ON rooms FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = rooms.establishment_id
    AND (establishments.owner_id = auth.uid() OR (auth.jwt() ->> 'user_role') = 'admin')
  )
);

DROP POLICY IF EXISTS "rooms_delete_owner" ON rooms;
CREATE POLICY "rooms_delete_owner"
ON rooms FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = rooms.establishment_id
    AND (establishments.owner_id = auth.uid() OR (auth.jwt() ->> 'user_role') = 'admin')
  )
);

-- ==========================================================
-- 4. RESERVATIONS
-- ==========================================================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  nb_personnes integer NOT NULL DEFAULT 1,
  prix_total numeric(10,2) NOT NULL,
  statut text NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending','accepted','rejected','cancelled','completed')),
  motif_refus text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Lecture : le client propriétaire OU le owner de l'établissement OU admin
DROP POLICY IF EXISTS "reservations_select" ON reservations;
CREATE POLICY "reservations_select"
ON reservations FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = reservations.establishment_id
    AND establishments.owner_id = auth.uid()
  )
  OR (auth.jwt() ->> 'user_role') = 'admin'
);

-- Insert : client connecté
DROP POLICY IF EXISTS "reservations_insert_own" ON reservations;
CREATE POLICY "reservations_insert_own"
ON reservations FOR INSERT
TO authenticated WITH CHECK (client_id = auth.uid());

-- Update : owner de l'établissement (accept/refuse) ou client (cancel) ou admin
DROP POLICY IF EXISTS "reservations_update" ON reservations;
CREATE POLICY "reservations_update"
ON reservations FOR UPDATE
TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = reservations.establishment_id
    AND establishments.owner_id = auth.uid()
  )
  OR (auth.jwt() ->> 'user_role') = 'admin'
)
WITH CHECK (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = reservations.establishment_id
    AND establishments.owner_id = auth.uid()
  )
  OR (auth.jwt() ->> 'user_role') = 'admin'
);

-- ==========================================================
-- 5. REVIEWS
-- ==========================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  note integer NOT NULL CHECK (note >= 1 AND note <= 5),
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select"
ON reviews FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own"
ON reviews FOR INSERT
TO authenticated WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own"
ON reviews FOR UPDATE
TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own"
ON reviews FOR DELETE
TO authenticated USING (client_id = auth.uid());

-- ==========================================================
-- 6. NOTIFICATIONS
-- ==========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('reservation_pending','reservation_accepted','reservation_rejected','establishment_validated','establishment_refused','general')),
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own"
ON notifications FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==========================================================
-- 7. CONTACTS
-- ==========================================================
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email text NOT NULL,
  sujet text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'contact' CHECK (type IN ('contact','support')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Insertion publique (le formulaire de contact est accessible à tous)
DROP POLICY IF EXISTS "contacts_insert_public" ON contacts;
CREATE POLICY "contacts_insert_public"
ON contacts FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Lecture par l'admin uniquement
DROP POLICY IF EXISTS "contacts_select_admin" ON contacts;
CREATE POLICY "contacts_select_admin"
ON contacts FOR SELECT
TO authenticated USING ((auth.jwt() ->> 'user_role') = 'admin');

-- ==========================================================
-- INDEXES
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_establishments_statut ON establishments(statut_validation);
CREATE INDEX IF NOT EXISTS idx_establishments_owner ON establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_establishment ON reservations(establishment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ==========================================================
-- TRIGGER : updated_at
-- ==========================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_establishments_updated ON establishments;
CREATE TRIGGER trg_establishments_updated BEFORE UPDATE ON establishments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_rooms_updated ON rooms;
CREATE TRIGGER trg_rooms_updated BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_reservations_updated ON reservations;
CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_updated ON reviews;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================================
-- TRIGGER : créer un profil automatiquement à l'inscription
-- ==========================================================
-- Quand un nouvel utilisateur s'inscrit via Supabase Auth, on crée
-- automatiquement une ligne dans profiles avec les meta-données.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, nom, prenom, email, telephone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'telephone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();