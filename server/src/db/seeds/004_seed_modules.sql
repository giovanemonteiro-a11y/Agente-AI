-- Assign commercial module to Bruna Moreira
UPDATE users SET modules = ARRAY['commercial'] WHERE email = 'bruna.moreira@v4company.com' AND (modules IS NULL OR modules = '{}');

-- Assign backup module to Bruno Ribeiro
UPDATE users SET modules = ARRAY['backup'] WHERE email = 'bruno.ribeiro@v4company.com' AND (modules IS NULL OR modules = '{}');
