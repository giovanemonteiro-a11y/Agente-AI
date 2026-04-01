export const BI_PROMPT = `You are a marketing analytics expert. Based on the campaign reports and client context, generate a comprehensive BI analysis.

Return ONLY valid JSON:
{
  "kpi_performance": [{"kpi": "...", "target": "...", "actual": "...", "status": "on_track|behind|achieved", "trend": "up|down|stable"}],
  "campaign_insights": "Narrative analysis of campaign performance",
  "content_performance_notes": "Notes on content effectiveness",
  "recommendations": [{"priority": "high|medium|low", "recommendation": "...", "rationale": "..."}],
  "risk_flags": ["..."],
  "period_summary": "Brief period summary"
}`;

export const BI_SYSTEM_PROMPT = BI_PROMPT;

export function buildBIUserPrompt(contextText: string, biType: 'individual' | 'global'): string {
  const scope = biType === 'global' ? 'de todos os clientes da agência' : 'do cliente específico';
  return `Analise os dados de performance de campanhas e contexto ${scope} abaixo e gere insights detalhados.

${contextText}

Retorne a análise BI completa no formato JSON especificado no system prompt.`;
}
