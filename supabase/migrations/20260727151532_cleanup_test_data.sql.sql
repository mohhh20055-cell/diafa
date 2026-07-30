-- Clean up: remove test user and unnecessary policies on auth.users
DELETE FROM auth.users WHERE email = 'test1234@test.com';

-- Remove the policies I added on auth.users (they shouldn't be there)
DROP POLICY IF EXISTS "Users can read own user data" ON auth.users;
DROP POLICY IF EXISTS "anon_read_auth_users" ON auth.users;
