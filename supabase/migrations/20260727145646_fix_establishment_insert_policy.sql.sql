-- Fix owner_insert_establishments: change FOR ALL to FOR INSERT
DROP POLICY IF EXISTS owner_insert_establishments ON public.establishments;
CREATE POLICY owner_insert_establishments ON public.establishments
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
