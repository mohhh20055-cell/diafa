-- Update demo user passwords with argon2id hashes (GoTrue v2.193.1 default)
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$yTQ0ltEGszEKLuJDmIDFYA$uVhdXm36/RygWJTQdSdC1AjZTc57oo3pW1Itimm0gUw' WHERE email = 'admin@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$eIalJ/6NawJefNhuWA/W2w$Q1Crha8yDSba04tiq381WMtPadReBOCEMdlq/3ZVNnQ' WHERE email = 'owner@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$Qz972JQXqz6mwT+AJY0gbg$fyX0R93aEozhNiDGRh8JBhI6sVpz140WLJm/iolL/xw' WHERE email = 'client@diyafa.dz';
UPDATE auth.users SET encrypted_password = '$argon2id$v=19$m=65536,t=3,p=4$V8nJm9XhoNs0dwTxozDf4g$aOoHUtzQK7riJl0L4DwASvlPeAJjybCUX86xJq5I08g' WHERE email = 'founder@diyafa.dz';
