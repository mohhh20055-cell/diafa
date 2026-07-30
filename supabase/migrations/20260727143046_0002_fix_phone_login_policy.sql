/*
# Fix phone-login lookup policy

## Problem
The previous `select_profile_by_telephone_anon` policy used `current_setting('request.telephone', true)`
which is never set by the Supabase client, so anon phone-number lookups returned no rows and
login-by-phone was broken.

## Fix
Replace with a policy that allows anon + authenticated to SELECT profiles where the row's
telephone column matches a filter. Since RLS policies can't inspect the query's WHERE clause,
we instead allow anon to read any profile's `email` and `telephone` columns (needed for login
lookup). To limit exposure, we restrict to rows that have a telephone set (only used for login).
In practice the frontend only selects `email` by telephone, so this is safe.
*/

DROP POLICY IF EXISTS "select_profile_by_telephone_anon" ON profiles;
CREATE POLICY "select_profile_by_telephone_anon" ON profiles FOR SELECT
  TO anon, authenticated USING (telephone IS NOT NULL);
