-- V4 Company team users
-- Passwords are randomly generated; users must reset on first login (must_reset_password = true)
-- Exception: super_admin (pxpconnection@gmail.com) has fixed password: z2LDs98Rnb@

-- Super Admin (God Mode)
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('PXP Connection', 'pxpconnection@gmail.com', '$2a$12$3euZQWYZWil2Jje/slq94uyVLy/Yqkk3QdOZSbT4aFYa9An5gp3Hm', 'super_admin', false) ON CONFLICT (email) DO NOTHING;

-- Liderança
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Bruno Henrique', 'bruno.ribeiro@v4company.com', '$2a$12$Ss8WFGC6rLR5AVpiaeymV.OQYRoc0cKDQuFyf8kyfPPw3LAfUnkgG', 'lideranca', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Bruna Moreira', 'bruna.moreira@v4company.com', '$2a$12$9ozmTq8zWkrL10v5jHpqI.5ifETBkvAI0wJb1UIpcLNnFcVliJYDu', 'lideranca', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Gerson Ferreira', 'gerson.ferreira@v4company.com', '$2a$12$UcrpVZLafViJiyjlUrBovekfuVEVHQdaeHWprjfBEAaljhalBtHs2', 'lideranca', true) ON CONFLICT (email) DO NOTHING;

-- Aquisição
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Sandro Notari', 'sandro.notari@v4company.com', '$2a$12$u6pHSeE3EieSUzV6qirx1eEII4.KSeLpitkFXz469O0JJjBF4Ipg.', 'aquisicao', true) ON CONFLICT (email) DO NOTHING;

-- Coordenadora
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Ester Prudêncio', 'ester.prudencio@v4company.com', '$2a$12$bAf2hPP58pRbZ0wanFyvXOGqswvLhNLTfgacoVLtvXzDsmQz1NnoC', 'coordenador', true) ON CONFLICT (email) DO NOTHING;

-- Accounts
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Miriam Ozores', 'mirian.ozores@v4company.com', '$2a$12$zqAXXM6BCmkdozvScZVrm.dR67LK/Wnb6CQwJcozbB2LbHbL832vW', 'account', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Jéssica Pitel', 'jessica.pitel@v4company.com', '$2a$12$k8nxTB4ijkuKctGBjxsn1.vBLIkzuETJJXPxVjtvOKFRlK3NgZqFK', 'account', true) ON CONFLICT (email) DO NOTHING;

-- Designers
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Giovane Monteiro', 'giovane.monteiro@v4company.com', '$2a$12$GF5FOpxbvfc84qMdXXo2K.lfqb2eiVkvpnt2bHpAG52Qs3dxZrkd.', 'designer', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Melissa Bernardes', 'melissa.bernardes@v4company.com', '$2a$12$LSUWccUHbJXcB5xcYUPlU.xogYBxc.LNvdWshtT0Fq96XvZJtYvMa', 'designer', true) ON CONFLICT (email) DO NOTHING;

-- Gestores de Tráfego
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Anderson Areão', 'anderson.areao@v4company.com', '$2a$12$8cV3XpPJ14WaciAm5SCpT.EpxCTYeM/Va9UQR7NxXukbj.fY5BoZ2', 'gestor_trafego', true) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('Gabriel Pimenta', 'gabriel.pimenta@v4company.com', '$2a$12$1Tl9eoEwWo0QX9QYq9qG0uRROjKM1aZj6oYm7WA4j7q5K3aUutvWW', 'gestor_trafego', true) ON CONFLICT (email) DO NOTHING;

-- Tech CRM
INSERT INTO users (name, email, password_hash, role, must_reset_password) VALUES ('João Pereira', 'joao.pereira@v4company.com', '$2a$12$f6vTk0rDlGYw/nZOqitVDue4O9F5DTuWc4AZhfs0cWf4e3s7J9Lj.', 'tech_crm', true) ON CONFLICT (email) DO NOTHING;
