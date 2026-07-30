/*
# Fix infinite recursion in profiles RLS policies

## Problem
The admin policies on `profiles` (and other tables) used:
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
This queries `profiles` from within a policy ON `profiles`, causing
infinite recursion (PostgreSQL error 42P17).

## Fix
1. Create a `is_admin()` SECURITY DEFINER function that reads the
   caller's role from `profiles` while bypassing RLS (the function
   executes as the owner, so no recursion).
2. Drop and recreate every admin policy that referenced `profiles`
   in a subquery, replacing the subquery with `is_admin()`.
3. Also drop the duplicate anon INSERT policy on `profiles`
   (two INSERT policies with the same check is redundant).

## Tables affected
- profiles (select / update admin policies)
- establishments (select / update admin policies)
- reservations (select admin policy)
- rooms (select admin policy)
- contacts (select admin policy)

## Notes
- `is_admin()` returns true only when the authenticated user's role is 'admin'.
- No data is modified or deleted; only policy definitions change.
*/

-- 1. Helper function: bypasses RLS (SECURITY DEFINER) to avoid recursion
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

-- 2. profiles: drop recursive admin policies, recreate with is_admin()
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;
CREATE POLICY "admin_select_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Remove duplicate anon insert policy (insert_own_profile_anon is redundant)
DROP POLICY IF EXISTS "insert_own_profile_anon" ON public.profiles;

-- 3. establishments: admin select / update
DROP POLICY IF EXISTS "admin_select_all_establishments" ON public.establishments;
CREATE POLICY "admin_select_all_establishments"
  ON public.establishments FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_establishments" ON public.establishments;
CREATE POLICY "admin_update_establishments"
  ON public.establishments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. reservations: admin select
DROP POLICY IF EXISTS "admin_select_all_reservations" ON public.reservations;
CREATE POLICY "admin_select_all_reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 5. rooms: admin select
DROP POLICY IF EXISTS "admin_select_rooms" ON public.rooms;
CREATE POLICY "admin_select_rooms"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6. contacts: admin select
DROP POLICY IF EXISTS "admin_select_contacts" ON public.contacts;
CREATE POLICY "admin_select_contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (public.is_admin());
