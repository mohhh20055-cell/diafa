-- Fix: demo accounts missing provider metadata in raw_app_meta_data
-- This causes "Database error querying schema" on login
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
WHERE email IN ('admin@diyafa.dz', 'owner@diyafa.dz', 'client@diyafa.dz', 'founder@diyafa.dz');
