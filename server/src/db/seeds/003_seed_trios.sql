-- Trio 1: Jéssica (Account) + Gabriel (GT) + Giovane (Designer) + João (Tech)
INSERT INTO trios (name, account_user_id, designer_user_id, gt_user_id, tech_user_id)
SELECT 'Trio 1 — Jéssica, Gabriel, Giovane',
  (SELECT id FROM users WHERE email = 'jessica.pitel@v4company.com'),
  (SELECT id FROM users WHERE email = 'giovane.monteiro@v4company.com'),
  (SELECT id FROM users WHERE email = 'gabriel.pimenta@v4company.com'),
  (SELECT id FROM users WHERE email = 'joao.pereira@v4company.com')
WHERE NOT EXISTS (SELECT 1 FROM trios WHERE name LIKE 'Trio 1%');

-- Trio 2: Miriam (Account) + Anderson (GT) + Melissa (Designer) + João (Tech)
INSERT INTO trios (name, account_user_id, designer_user_id, gt_user_id, tech_user_id)
SELECT 'Trio 2 — Miriam, Anderson, Melissa',
  (SELECT id FROM users WHERE email = 'mirian.ozores@v4company.com'),
  (SELECT id FROM users WHERE email = 'melissa.bernardes@v4company.com'),
  (SELECT id FROM users WHERE email = 'anderson.areao@v4company.com'),
  (SELECT id FROM users WHERE email = 'joao.pereira@v4company.com')
WHERE NOT EXISTS (SELECT 1 FROM trios WHERE name LIKE 'Trio 2%');
