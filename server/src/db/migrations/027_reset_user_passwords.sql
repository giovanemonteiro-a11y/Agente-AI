-- Migration 027: Reset user passwords to new temporary hashes
-- Users with must_reset_password = true will be prompted to create a new password on first login

UPDATE users SET password_hash = '$2a$12$XoYZM0MbSTLzDenRcMeVAu0BKqkYZiVIRIvirHOHZQ7wcSEtRDcN6', must_reset_password = true WHERE email = 'bruno.ribeiro@v4company.com';
UPDATE users SET password_hash = '$2a$12$9S1JZItx8XswgThcvMIu9eI58O73mBIN1SOwrflaHwQIMRjDN9Yta', must_reset_password = true WHERE email = 'bruna.moreira@v4company.com';
UPDATE users SET password_hash = '$2a$12$U8Bbs27.A1NoePQ4Wb4hwOU1bQWqurs1KpEcLwN54L2TMxubNjbX.', must_reset_password = true WHERE email = 'gerson.ferreira@v4company.com';
UPDATE users SET password_hash = '$2a$12$MKcQIOvV0zSe0e.0DIDbYu0PiBEbv20k32qJfAY01XdwDdJXkge0u', must_reset_password = true WHERE email = 'sandro.notari@v4company.com';
UPDATE users SET password_hash = '$2a$12$UgxM9Wk3.KBGo1F/TSe/cOVReX4zsaUjns0pODK3GetfkO4TM9592', must_reset_password = true WHERE email = 'ester.prudencio@v4company.com';
UPDATE users SET password_hash = '$2a$12$4MtBgYAWQHJ8wRpb./2/2ueUS2Ox9APdW5mjJOUvfWlXJrr2jeYyi', must_reset_password = true WHERE email = 'mirian.ozores@v4company.com';
UPDATE users SET password_hash = '$2a$12$5VaOufL6.vjvWJYXKKDQ0OxPRnB4YYniFUKjngfFs/27caPxMiCL2', must_reset_password = true WHERE email = 'jessica.pitel@v4company.com';
UPDATE users SET password_hash = '$2a$12$/QPxDvtpSizQaEIMa5P6Xe17CJpyRWrnZuGKzDmYlhy.p.bpQjN.S', must_reset_password = true WHERE email = 'giovane.monteiro@v4company.com';
UPDATE users SET password_hash = '$2a$12$FPs/z6H2e.JPbRtTNDXbDOB2RIHqvqxa5QaOoLwTblwQzFBj4BXPe', must_reset_password = true WHERE email = 'melissa.bernardes@v4company.com';
UPDATE users SET password_hash = '$2a$12$xcCPfskhcitXbQ4huoZ.NeIDk4oTyFVi8r5t/yBALBFRFva2ee0ou', must_reset_password = true WHERE email = 'anderson.areao@v4company.com';
UPDATE users SET password_hash = '$2a$12$ay6iwQjofmYHerdWr6kEs.AeIAX8DXeHNL5lKiHnzwItP6UufshWG', must_reset_password = true WHERE email = 'gabriel.pimenta@v4company.com';
UPDATE users SET password_hash = '$2a$12$mDsXniJZED6khhof9qSUaeuuu4.8.Ti62xYSrL3hCFmM9EvTqouJq', must_reset_password = true WHERE email = 'joao.pereira@v4company.com';
