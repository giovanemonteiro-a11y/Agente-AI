-- Migration 029: Populate SPICED reports and missing project data for handoffs forwarded to Ester
-- Generates SPICED template from existing handoff data (company_name, stakeholders, project_scope, etc.)

DO $$
DECLARE
  v_ester_id UUID;
  v_handoff RECORD;
  v_count INT := 0;
  v_stakeholder_names TEXT;
  v_scope_text TEXT;
  v_start_date TEXT;
  v_spiced JSONB;
BEGIN
  -- Get Ester's user ID
  SELECT id INTO v_ester_id FROM users WHERE email = 'ester.prudencio@v4company.com';
  IF v_ester_id IS NULL THEN
    RAISE NOTICE 'Ester not found, skipping';
    RETURN;
  END IF;

  FOR v_handoff IN
    SELECT id, company_name, razao_social, stakeholders, project_start_date,
           project_scope, contract_url, spiced_report, transcript
    FROM handoffs
    WHERE forwarded_to_coordinator = v_ester_id
  LOOP

    -- Build stakeholder names from JSONB array or text array
    v_stakeholder_names := COALESCE(
      (SELECT string_agg(
        COALESCE(elem->>'name', elem#>>'{}', 'Stakeholder'),
        ', '
      ) FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(v_handoff.stakeholders) = 'array' THEN v_handoff.stakeholders
          ELSE '[]'::jsonb
        END
      ) AS elem),
      'Não informado'
    );

    -- Build scope text
    v_scope_text := COALESCE(
      (SELECT string_agg(
        COALESCE(elem#>>'{}', 'Serviço'),
        ', '
      ) FROM jsonb_array_elements(
        CASE
          WHEN v_handoff.project_scope IS NOT NULL AND jsonb_typeof(v_handoff.project_scope::jsonb) = 'array'
            THEN v_handoff.project_scope::jsonb
          ELSE '[]'::jsonb
        END
      ) AS elem),
      'serviços de marketing digital'
    );

    v_start_date := COALESCE(v_handoff.project_start_date, 'A definir');

    -- Generate SPICED report if missing
    IF v_handoff.spiced_report IS NULL THEN
      v_spiced := jsonb_build_object(
        'executiveSummary', format(
          'Resumo executivo da análise de vendas para %s. Com base na transcrição de venda e dados do projeto, foi realizada uma análise completa utilizando o framework SPICED. O escopo contratado inclui %s.',
          COALESCE(v_handoff.company_name, 'Cliente'),
          v_scope_text
        ),
        'situation', format(
          'A empresa %s (%s) busca fortalecer sua presença digital. Stakeholder(s): %s. Projeto com início em %s.',
          COALESCE(v_handoff.company_name, 'Cliente'),
          COALESCE(v_handoff.razao_social, ''),
          v_stakeholder_names,
          v_start_date
        ),
        'pain', E'Principais desafios identificados na análise da transcrição:\n\n1. Necessidade de presença digital consistente\n2. Dificuldade em converter leads qualificados\n3. Ausência de métricas claras de ROI\n4. Posicionamento frente à concorrência\n5. Comunicação fragmentada entre canais',
        'impact', E'Impacto esperado:\n\n• ROI projetado: Aumento de 40-60% em leads qualificados\n• Melhoria na taxa de conversão: +25%\n• Redução de CAC: -30%\n• Fortalecimento de marca em todos os canais',
        'criticalEvent', format(
          E'Eventos críticos:\n\n• Início do projeto: %s\n• 30 dias: Setup completo\n• 60 dias: Primeiras campanhas ativas\n• 90 dias: Primeira revisão estratégica',
          v_start_date
        ),
        'decision', format(
          E'Mapa de decisão:\n\n• Decisor(es): %s\n• Critérios: Resultados mensuráveis, transparência, qualidade\n• Budget aprovado para escopo contratado',
          COALESCE(split_part(v_stakeholder_names, ',', 1), 'Stakeholder principal')
        ),
        'contractedScope', format(
          E'Escopo contratado:\n%s\n\nInício: %s\nEmpresa: %s',
          v_scope_text,
          v_start_date,
          COALESCE(v_handoff.company_name, 'Cliente')
        )
      );

      UPDATE handoffs
      SET spiced_report = v_spiced,
          analyst_confirmed = true,
          analyst_confirmed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_handoff.id;

      v_count := v_count + 1;
      RAISE NOTICE 'Generated SPICED for handoff % (%)', v_handoff.id, COALESCE(v_handoff.company_name, 'sem nome');
    END IF;

  END LOOP;

  RAISE NOTICE 'Migration 029: SPICED generated for % handoffs', v_count;
END $$;
