-- Update demo user passwords using pgcrypto's crypt() function
-- This generates bcrypt hashes the same way GoTrue does internally
UPDATE auth.users SET encrypted_password = crypt('admin123', gen_salt('bf', 10)) WHERE email = 'admin@diyafa.dz';
UPDATE auth.users SET encrypted_password = crypt('owner123', gen_salt('bf', 10)) WHERE email = 'owner@diyafa.dz';
UPDATE auth.users SET encrypted_password = crypt('client123', gen_salt('bf', 10)) WHERE email = 'client@diyafa.dz';
UPDATE auth.users SET encrypted_password = crypt('founder123', gen_salt('bf', 10)) WHERE email = 'founder@diyafa.dz';
