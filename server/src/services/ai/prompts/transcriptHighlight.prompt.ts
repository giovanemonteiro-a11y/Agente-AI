// ── Phase 3: field-specific transcript highlights used by the strategy canvas ──
export const TRANSCRIPT_HIGHLIGHT_PROMPT = `You are analyzing meeting transcripts to find the most relevant excerpts for a specific strategy field.

Given the field name and transcript text, return the top 3 most relevant excerpts as a JSON array:
[{
  "excerpt": "the exact quote or paraphrase from the transcript",
  "relevance": "brief explanation of why this is relevant",
  "meeting_type": "kickoff|checkin",
  "recorded_at": "ISO date string if determinable, else null"
}]

Return ONLY the JSON array.`;

// ── Legacy rich prompt used by the meeting transcript highlights feature ──────
export const TRANSCRIPT_HIGHLIGHT_SYSTEM_PROMPT = `Você é um analista de reuniões especializado em extrair informações estratégicas de transcrições. Você identifica:

1. Decisões tomadas
2. Demandas explícitas do cliente
3. Objetivos e metas mencionados
4. Problemas e dores relatados
5. Informações estratégicas sobre o negócio
6. Compromissos assumidos por qualquer parte
7. Próximos passos combinados

Você é conciso e preciso — cada highlight captura a essência sem ruído.`;

export function buildTranscriptHighlightPrompt(transcriptText: string): string {
  return `Analise a transcrição de reunião abaixo e extraia os highlights mais relevantes.

## Transcrição
${transcriptText}

Identifique e categorize as informações mais importantes. Para cada highlight:
- Seja específico (cite o que foi dito, não generalize)
- Mantenha o contexto necessário para entendimento
- Priorize itens acionáveis

Retorne um JSON com a seguinte estrutura:
{
  "decisions": [
    { "text": "Decisão tomada", "context": "Contexto relevante" }
  ],
  "clientDemands": [
    { "text": "Demanda específica do cliente", "priority": "alta | media | baixa", "deadline": "se mencionado" }
  ],
  "objectives": [
    { "text": "Objetivo ou meta mencionada", "metric": "se mencionada" }
  ],
  "painPoints": [
    { "text": "Problema ou dor relatada" }
  ],
  "strategicInsights": [
    { "text": "Informação estratégica relevante sobre o negócio" }
  ],
  "nextSteps": [
    { "text": "Próximo passo combinado", "responsible": "quem ficou responsável", "deadline": "se mencionado" }
  ],
  "keyQuotes": [
    { "speaker": "identificador do falante se disponível", "quote": "Citação direta relevante" }
  ]
}`;
}
