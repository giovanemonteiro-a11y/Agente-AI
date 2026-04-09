-- Migration 028: Forward all Leadership CRM handoffs to Coordenadora Ester
-- Extraordinary action: Leadership is offline, transferring all pending handoffs to Coordinator Ester Prudêncio
-- This updates handoffs with status: sent_to_leadership, approved_partial, approved_all
-- Sets forwarded_to_coordinator = Ester's user_id, status = 'forwarded_to_coordinator'
-- Also creates real-time notifications for Ester's bell icon

DO $$
DECLARE
  v_ester_id UUID;
  v_forwarder_id UUID;
  v_handoff RECORD;
  v_count INT := 0;
BEGIN
  -- Get Ester's user ID
  SELECT id INTO v_ester_id FROM users WHERE email = 'ester.prudencio@v4company.com';
  IF v_ester_id IS NULL THEN
    RAISE EXCEPTION 'Coordenadora Ester not found in users table';
  END IF;

  -- Get a leadership user as the "forwarder" (Giovane as super_admin acting on behalf)
  SELECT id INTO v_forwarder_id FROM users WHERE email = 'giovane.monteiro@v4company.com';
  IF v_forwarder_id IS NULL THEN
    -- Fallback to any leadership user
    SELECT id INTO v_forwarder_id FROM users WHERE role = 'lideranca' LIMIT 1;
  END IF;

  -- Forward all handoffs currently in Leadership CRM that haven't been forwarded yet
  FOR v_handoff IN
    SELECT id, company_name
    FROM handoffs
    WHERE status IN ('sent_to_leadership', 'approved_partial', 'approved_all')
      AND forwarded_to_coordinator IS NULL
  LOOP
    -- Update handoff: forward to Ester
    UPDATE handoffs
    SET forwarded_to_coordinator = v_ester_id,
        forwarded_by = v_forwarder_id,
        forwarded_at = NOW(),
        status = 'forwarded_to_coordinator',
        updated_at = NOW()
    WHERE id = v_handoff.id;

    -- Create notification for Ester (bell icon)
    INSERT INTO notifications (user_id, type, title, message, data_json)
    VALUES (
      v_ester_id,
      'handoff:forwarded',
      'Handoff encaminhado: ' || COALESCE(v_handoff.company_name, 'Sem nome'),
      'O handoff de ' || COALESCE(v_handoff.company_name, 'Sem nome') || ' foi encaminhado para sua coordenação.',
      jsonb_build_object('handoff_id', v_handoff.id)
    );

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Migration 028: % handoffs forwarded to Coordenadora Ester Prudêncio', v_count;
END $$;
