-- Migration 031: Reset Bruno's password to random temporary + must_reset_password
UPDATE users
SET password_hash = '$2a$12$zDFLlI9Q5z.qVMRXAjEGRu3ck5Y6EhbmT.gXHupkpP6528rZyzyUu',
    must_reset_password = true
WHERE email = 'bruno.ribeiro@v4company.com';
