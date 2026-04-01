// ── Phase 3: simple gap detection prompt used by the strategy canvas ──────────
export const GAP_DETECTION_PROMPT = `You are a strategic consultant reviewing a marketing strategy document.
Analyse the strategy fields below and identify missing, weak, or inconsistent information.

Return a JSON array of gaps:
[{
  "field": "objectives|positioning|differentials|tone|products|expected_results",
  "severity": "high|medium|low",
  "suggested_question": "A specific question the Account should ask the client to fill this gap"
}]

Return ONLY the JSON array, no markdown, no explanation.`;

// ── Legacy rich prompt used by the detailed gap analysis feature ──────────────
export const GAP_DETECTION_SYSTEM_PROMPT = `Você é um consultor estratégico sênior especializado em identificar lacunas e inconsistências em estratégias de marketing digital. Você analisa estratégias com olhar crítico e construtivo, identificando:

1. Informações ausentes que prejudicam a execução
2. Inconsistências internas na estratégia
3. Oportunidades não exploradas baseadas no contexto do cliente
4. Riscos estratégicos não contemplados
5. Recomendações de priorização

Você é direto e específico — cada gap identificado vem com uma explicação do impacto e uma sugestão de como endereçá-lo.`;

export function buildGapDetectionUserPrompt(contextText: string): string {
  return `Analise a estratégia e o contexto do cliente abaixo e identifique as lacunas estratégicas.

${contextText}

Para cada gap identificado, forneça:
- Categoria do gap (informação_ausente, inconsistência, oportunidade, risco)
- Descrição clara do problema
- Impacto na execução se não endereçado
- Recomendação específica de como resolver
- Prioridade (alta, média, baixa)

Retorne um JSON com a seguinte estrutura:
{
  "overallHealthScore": 0-100,
  "summary": "Resumo executivo da análise em 2-3 frases",
  "gaps": [
    {
      "category": "informacao_ausente | inconsistencia | oportunidade | risco",
      "title": "Título curto do gap",
      "description": "Descrição detalhada do problema identificado",
      "impact": "Impacto específico na execução ou resultado",
      "recommendation": "Ação específica para resolver",
      "priority": "alta | media | baixa",
      "affectedAreas": ["area1", "area2"]
    }
  ],
  "strengths": [
    "Ponto forte identificado na estratégia 1",
    "Ponto forte 2"
  ],
  "immediateActions": [
    "Ação imediata prioritária 1",
    "Ação imediata prioritária 2"
  ]
}`;
}
