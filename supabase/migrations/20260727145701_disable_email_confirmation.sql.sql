-- Disable email confirmation for new signups so users can login immediately
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
