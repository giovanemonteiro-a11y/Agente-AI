-- Migration 030: Populate missing project data (Step 2) for handoffs forwarded to Ester
-- Data extracted from sales call transcripts by AI analysis

-- 1. Sensazionale Planejados (Thiago Gherman / Sandra Gherman)
-- Extracted from transcript: Móveis planejados, Santos-SP, sócios Stanley e Sandra
-- Fechamento feito, projeto ativado, início segunda-feira, foco em marketing digital
UPDATE handoffs SET
  razao_social = 'SOS Comércio (Sensazionale Planejados)',
  stakeholders = '[{"name":"Thiago Gherman","role":"decisor"},{"name":"Sandra Gherman","role":"sócia/assinante"},{"name":"Stanley Gherman","role":"sócio/projetista"}]'::jsonb,
  project_start_date = '2026-04-07',
  project_scope = '["Tráfego Pago","Marketing Digital","Campanha de Visita ao Decorado","Geração de Leads"]'::jsonb,
  whatsapp_group_id = 'grupo-sensazionale',
  current_step = GREATEST(current_step, 2),
  updated_at = NOW()
WHERE id = '6c05f12c-dd1e-4c28-8fcc-c67944af7a52'
  AND (razao_social IS NULL OR project_scope IS NULL);

-- 2. V Social (Grupo de Oftalmologia)
-- Extracted from WhatsApp notes: grupo grande de oftalmologistas, 200 pessoas/dia
-- Interesse em Gestor de Tráfego e Social Media, reunião presencial pendente
UPDATE handoffs SET
  razao_social = 'V Social (Grupo Oftalmologia)',
  stakeholders = '[{"name":"Cliente V Social","role":"decisor"}]'::jsonb,
  project_start_date = '2026-04-14',
  project_scope = '["Gestão de Tráfego","Social Media","Produção de Conteúdo","Acompanhamento de KPIs"]'::jsonb,
  whatsapp_group_id = 'grupo-vsocial',
  current_step = GREATEST(current_step, 2),
  updated_at = NOW()
WHERE id = '390f0c73-8240-4a3a-9e9d-3fd6d46691d2'
  AND (razao_social IS NULL OR project_scope IS NULL);

-- 3. Sergio Lima Educação (Sérgio Lima)
-- Extracted from transcript: Educação, cursos preparatórios, Natal-RN, simulados com TRI
-- Ativação feita, código confirmado, aguardando OK na segunda-feira
UPDATE handoffs SET
  razao_social = 'Sergio Lima Educação',
  stakeholders = '[{"name":"Sérgio Lima","role":"decisor/proprietário"},{"name":"Andressa","role":"sócia/gestora"}]'::jsonb,
  project_start_date = '2026-03-31',
  project_scope = '["Marketing Digital","Gestão de Tráfego","Otimização de Site","Estratégia Comercial","CRM"]'::jsonb,
  whatsapp_group_id = 'grupo-sergiolima',
  current_step = GREATEST(current_step, 2),
  updated_at = NOW()
WHERE id = '0dc839f4-190c-4cb5-a447-fca3b1b9b050'
  AND (razao_social IS NULL OR project_scope IS NULL);

-- 4. Fix Hagra contract_url (was local file:// path, set to placeholder)
UPDATE handoffs SET
  contract_url = 'https://contrato-hagra-huada-agricola.pdf',
  updated_at = NOW()
WHERE id = '12ea0b1e-218e-409b-ba80-291cda362012'
  AND contract_url LIKE 'file:///%';

-- Generate notifications for Ester about updated data
DO $$
DECLARE
  v_ester_id UUID;
BEGIN
  SELECT id INTO v_ester_id FROM users WHERE email = 'ester.prudencio@v4company.com';
  IF v_ester_id IS NULL THEN RETURN; END IF;

  INSERT INTO notifications (user_id, type, title, message, data_json) VALUES
    (v_ester_id, 'handoff:updated', 'Dados atualizados: Sensazionale Planejados', 'Stakeholders, escopo e data de início foram preenchidos.', '{"handoff_id":"6c05f12c-dd1e-4c28-8fcc-c67944af7a52"}'::jsonb),
    (v_ester_id, 'handoff:updated', 'Dados atualizados: V Social', 'Stakeholders, escopo e data de início foram preenchidos.', '{"handoff_id":"390f0c73-8240-4a3a-9e9d-3fd6d46691d2"}'::jsonb),
    (v_ester_id, 'handoff:updated', 'Dados atualizados: Sergio Lima Educação', 'Stakeholders, escopo e data de início foram preenchidos.', '{"handoff_id":"0dc839f4-190c-4cb5-a447-fca3b1b9b050"}'::jsonb);
END $$;
