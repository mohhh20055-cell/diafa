-- Create handle_new_user function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix insert_own_profile: change FOR ALL to proper FOR INSERT
DROP POLICY IF EXISTS insert_own_profile ON public.profiles;
CREATE POLICY insert_own_profile ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Also allow anon to insert (needed if trigger runs before auth context is ready)
CREATE POLICY insert_own_profile_anon ON public.profiles
  FOR INSERT TO anon, authenticated WITH CHECK (auth.uid() = id);
