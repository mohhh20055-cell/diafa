-- Update demo account passwords with fresh bcrypt hashes
-- admin123, owner123, client123, founder123
UPDATE auth.users SET encrypted_password = '$2b$10$nVGJaERUhaZ9783gfEbw4e7IrOtp/ewLyJBVVEOCH8dh7UnHi7IzS' WHERE email = 'admin@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$2b$10$2YDSxwrwh3ABYGU9yDGyu.bbII0jpyvmgMz9AaWU0LMs9qMkjsWNW' WHERE email = 'owner@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$2b$10$z/vVROJhA.TIZmzrc1RJtudjnKr68HYfEeNvS6w6dxUD9R4ADdvDq' WHERE email = 'client@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$2b$10$vUrcpUzpkdO9ifXKw0Awc.YDiK8J9pakep/msKroXrUTi1BXquwnu' WHERE email = 'founder@diyafa.dz';
