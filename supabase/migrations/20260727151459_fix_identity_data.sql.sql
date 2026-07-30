-- Fix: demo accounts' identities missing email_verified/phone_verified in identity_data
UPDATE auth.identities 
SET identity_data = identity_data || '{"email_verified":true,"phone_verified":false}'::jsonb
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@diyafa.dz', 'owner@diyafa.dz', 'client@diyafa.dz', 'founder@diyafa.dz')
);
