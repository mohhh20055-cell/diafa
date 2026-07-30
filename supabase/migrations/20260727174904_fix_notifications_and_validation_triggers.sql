/*
# Fix notifications system + add establishment validation notifications

## Problem
The notifications INSERT RLS policy requires `user_id = auth.uid()`,
so when the code tries to notify ANOTHER user (e.g. owner gets notified
when a client reserves, or owner gets notified when admin validates
their establishment), the insert is silently blocked by RLS.

## Fix
1. Create `create_notification()` SECURITY DEFINER function that
   inserts into notifications bypassing RLS. Any authenticated user
   can call it via RPC.
2. Add a DB trigger `notify_admins_on_establishment` that fires AFTER
   INSERT on establishments: when a new establishment is created with
   statut 'en_attente', notify all admin users.
3. Add a DB trigger `notify_owner_on_validation` that fires AFTER
   UPDATE on establishments: when statut_validation changes to 'valide'
   or 'refuse', notify the establishment owner.

## No data loss
- No tables dropped or columns changed.
- Existing notifications are untouched.
- Policies on notifications table are NOT changed (still secure).
*/

-- ============================================================
-- 1. SECURITY DEFINER function to insert notifications
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

-- ============================================================
-- 2. Helper: get all admin user IDs
-- ============================================================
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

-- ============================================================
-- 3. Trigger: notify admins when a new establishment is submitted
-- ============================================================
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

-- ============================================================
-- 4. Trigger: notify owner when establishment is validated/refused
-- ============================================================
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
