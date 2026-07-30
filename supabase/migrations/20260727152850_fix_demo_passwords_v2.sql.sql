-- Update demo user passwords with GoTrue-compatible bcrypt hashes ($2a$ prefix)
UPDATE auth.users SET encrypted_password = '$2a$10$ai2tXCsYgxn50z20rtlm7Or5beWmQoD5MoUZSPHgRHACh/wka70.2' WHERE email = 'admin@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$2a$10$H0dyqyEBRB6V/ASi0IpAvOHHcoVCyZHYac2T7v/fNU/Jeu8TVsLwi' WHERE email = 'owner@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$2a$10$BAXSrW.h71rcF3UmXxzB8uZnYUJNglSEzgeMePFSclriEGioqYfWO' WHERE email = 'client@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$2a$10$kFzn.Edj6NKpff1wYC6x.edE0Ocov/lvgKBzDkuYUFsCBMNELuaom' WHERE email = 'founder@diyafa.dz';
