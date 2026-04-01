-- Assign commercial module to Bruna Moreira
UPDATE users SET modules = '["commercial"]'::jsonb WHERE email = 'bruna.moreira@v4company.com' AND (modules IS NULL OR modules = '[]'::jsonb);

-- Assign backup module to Bruno Ribeiro
UPDATE users SET modules = '["backup"]'::jsonb WHERE email = 'bruno.ribeiro@v4company.com' AND (modules IS NULL OR modules = '[]'::jsonb);
