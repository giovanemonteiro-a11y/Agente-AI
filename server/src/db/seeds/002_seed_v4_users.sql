-- V4 Company team users
-- Passwords are randomly generated; users must reset on first login (must_reset_password = true)
-- Exception: super_admin (pxpconnection@gmail.com) has fixed password: z2LDs98Rnb@

-- Super Admin (God Mode)
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('PXP Connection', 'pxpconnection@gmail.com', '$2a$12$3euZQWYZWil2Jje/slq94uyVLy/Yqkk3QdOZSbT4aFYa9An5gp3Hm', 'super_admin', false) ON CONFLICT (email) DO NOTHING;

-- Liderança
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Bruno Henrique', 'bruno.ribeiro@v4company.com', '$2a$12$XoYZM0MbSTLzDenRcMeVAu0BKqkYZiVIRIvirHOHZQ7wcSEtRDcN6', 'lideranca', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Bruna Moreira', 'bruna.moreira@v4company.com', '$2a$12$9S1JZItx8XswgThcvMIu9eI58O73mBIN1SOwrflaHwQIMRjDN9Yta', 'lideranca', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Gerson Ferreira', 'gerson.ferreira@v4company.com', '$2a$12$U8Bbs27.A1NoePQ4Wb4hwOU1bQWqurs1KpEcLwN54L2TMxubNjbX.', 'lideranca', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;

-- Aquisição
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Sandro Notari', 'sandro.notari@v4company.com', '$2a$12$MKcQIOvV0zSe0e.0DIDbYu0PiBEbv20k32qJfAY01XdwDdJXkge0u', 'aquisicao', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;

-- Coordenadora
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Ester Prudêncio', 'ester.prudencio@v4company.com', '$2a$12$UgxM9Wk3.KBGo1F/TSe/cOVReX4zsaUjns0pODK3GetfkO4TM9592', 'coordenador', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;

-- Accounts
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Miriam Ozores', 'mirian.ozores@v4company.com', '$2a$12$4MtBgYAWQHJ8wRpb./2/2ueUS2Ox9APdW5mjJOUvfWlXJrr2jeYyi', 'account', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Jéssica Pitel', 'jessica.pitel@v4company.com', '$2a$12$5VaOufL6.vjvWJYXKKDQ0OxPRnB4YYniFUKjngfFs/27caPxMiCL2', 'account', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;

-- Designers
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Giovane Monteiro', 'giovane.monteiro@v4company.com', '$2a$12$/QPxDvtpSizQaEIMa5P6Xe17CJpyRWrnZuGKzDmYlhy.p.bpQjN.S', 'designer', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Melissa Bernardes', 'melissa.bernardes@v4company.com', '$2a$12$FPs/z6H2e.JPbRtTNDXbDOB2RIHqvqxa5QaOoLwTblwQzFBj4BXPe', 'designer', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;

-- Gestores de Tráfego
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Anderson Areão', 'anderson.areao@v4company.com', '$2a$12$xcCPfskhcitXbQ4huoZ.NeIDk4oTyFVi8r5t/yBALBFRFva2ee0ou', 'gestor_trafego', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Gabriel Pimenta', 'gabriel.pimenta@v4company.com', '$2a$12$ay6iwQjofmYHerdWr6kEs.AeIAX8DXeHNL5lKiHnzwItP6UufshWG', 'gestor_trafego', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;

-- Tech CRM
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('João Pereira', 'joao.pereira@v4company.com', '$2a$12$mDsXniJZED6khhof9qSUaeuuu4.8.Ti62xYSrL3hCFmM9EvTqouJq', 'tech_crm', true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = true;
