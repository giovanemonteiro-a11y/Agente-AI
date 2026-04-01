-- Seed: Admin user
-- IMPORTANT: Change this password immediately after first login!
-- Default password: Admin@2024 (bcrypt hash below)
-- To generate a new hash: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 12).then(console.log)"

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@agenciainteligente.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHJW4I3KHB4m0Vy',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- Note: The hash above corresponds to 'Admin@2024'
-- Change this password immediately after first deployment!
