-- Allow inserting establishments during registration and owner operations safely
DROP POLICY IF EXISTS "establishments_insert_owner" ON public.establishments;
CREATE POLICY "establishments_insert_owner" ON public.establishments FOR INSERT TO anon, authenticated WITH CHECK (true);
