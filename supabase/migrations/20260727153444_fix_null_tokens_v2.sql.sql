-- Fix NULL token fields - GoTrue requires empty strings not NULL
UPDATE auth.users SET 
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  email_change_token_current = '',
  reauthentication_token = ''
WHERE email IN ('admin@diyafa.dz', 'owner@diyafa.dz', 'client@diyafa.dz', 'founder@diyafa.dz');
