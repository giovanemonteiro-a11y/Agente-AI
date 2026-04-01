-- Add modules column to users for feature-level access control
-- Similar pattern to email-based checks but more scalable

ALTER TABLE users ADD COLUMN IF NOT EXISTS modules TEXT[] NOT NULL DEFAULT '{}';

-- Assign modules to existing users
UPDATE users SET modules = ARRAY['backup'] WHERE email = 'bruno.ribeiro@v4company.com';
UPDATE users SET modules = ARRAY['commercial'] WHERE email = 'bruna.moreira@v4company.com';

CREATE INDEX idx_users_modules ON users USING GIN (modules);
