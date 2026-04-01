import { BriefingType } from '../../../types/index';

export const BRIEFING_SYSTEM_PROMPTS: Record<BriefingType, string> = {
  designer: `Você é um diretor de arte e criativo sênior que cria briefings de design detalhados e claros. Você traduz estratégia de marca e objetivos de campanha em instruções precisas para designers, incluindo referências visuais, paleta, tipografia, mood e entregas esperadas.`,

  traffic: `Você é um especialista em mídia paga e performance digital. Você cria briefings de tráfego pago detalhados que orientam gestores de tráfego sobre segmentações, criativos, objetivos de campanha, métricas de sucesso e estratégia de funil.`,

  account: `Você é um gerente de contas sênior que cria briefings de gestão de redes sociais. Você orienta sobre calendário editorial, tom de voz, tipos de conteúdo, frequência de postagens e interações com a audiência.`,

  site: `Você é um especialista em UX/UI e desenvolvimento web que cria briefings completos para projetos de site e landing pages, incluindo arquitetura de informação, fluxo de usuário, requisitos técnicos e referências de design.`,
};

export const DESIGNER_BRIEFING_PROMPT = `You are creating a detailed design briefing for a marketing agency designer.
Based on the client context, generate a comprehensive briefing.

Return ONLY valid JSON:
{
  "title": "Brief title",
  "scope_type": "social_media|campanha|landing_page|site|branding|miv",
  "objective": "Clear design objective",
  "target_cohort": "Which cohort(s) this targets",
  "visual_references": ["reference descriptions"],
  "deliverables": [{"item": "...", "format": "...", "dimensions": "...", "quantity": 1}],
  "tone_and_style": "Visual tone based on brand profile",
  "copy_references": ["key messages to include"],
  "deadline_suggestion": "Suggested timeline",
  "additional_notes": "Any extra context"
}`;

export const TRAFFIC_BRIEFING_PROMPT = `You are creating a campaign briefing for a traffic manager (paid media specialist).
Return ONLY valid JSON:
{
  "title": "Campaign title",
  "objective": "awareness|leads|conversion|retargeting",
  "budget_suggestion": "Budget range recommendation",
  "audience_segments": [{"name": "...", "cohort_reference": "...", "targeting_criteria": "..."}],
  "funnel_stages": [{"stage": "...", "message": "...", "creative_specs": "...", "cta": "..."}],
  "platforms": ["Meta Ads", "Google Ads"],
  "copy_variants": [{"stage": "...", "headline": "...", "body": "...", "cta": "..."}],
  "success_metrics": [{"metric": "...", "target": "..."}],
  "additional_notes": "..."
}`;

export const ACCOUNT_BRIEFING_PROMPT = `You are creating a strategic coordination briefing for an Account Manager.
Return ONLY valid JSON:
{
  "title": "Briefing title",
  "period": "Time period this covers",
  "client_status": "Current relationship status",
  "priorities": [{"item": "...", "urgency": "high|medium|low"}],
  "pending_decisions": ["..."],
  "checkin_prep": ["questions to ask in next meeting"],
  "team_coordination": [{"team_member_role": "...", "action_needed": "..."}],
  "risks_and_opportunities": "...",
  "additional_notes": "..."
}`;

export const SITE_BRIEFING_PROMPT = `You are creating a website/landing page briefing for a development team.
Return ONLY valid JSON:
{
  "title": "Project title",
  "objective": "Page goal and conversion intent",
  "target_audience": "Who this page is for",
  "structure": [{"section": "...", "content_needed": "...", "notes": "..."}],
  "seo_keywords": ["..."],
  "design_references": ["..."],
  "technical_requirements": ["..."],
  "copy_outline": "...",
  "deadline_suggestion": "...",
  "additional_notes": "..."
}`;

export function buildBriefingUserPrompt(
  type: BriefingType,
  contextText: string,
  sprintContext?: string,
  whatsappDemands?: string,
  designerScope?: string
): string {
  const roleSpecificInstructions: Record<BriefingType, string> = {
    designer: `Crie um briefing de design detalhado incluindo:
- Objetivo da campanha/peça
- Conceito criativo e direção de arte
- Referências visuais e mood board descritivo
- Paleta de cores e tipografia
- Entregas esperadas (formatos, dimensões, quantidade)
- Prazo e prioridades
- Mensagem principal e call-to-action`,

    traffic: `Crie um briefing de tráfego pago incluindo:
- Objetivo da campanha (awareness/conversão/remarketing)
- Público-alvo e segmentações recomendadas
- Plataformas (Meta/Google/TikTok/etc)
- Estrutura de campanha e conjuntos de anúncios
- Criativos necessários (formatos e mensagens)
- Orçamento e distribuição sugerida
- KPIs e metas de performance
- Período e estratégia de funil`,

    account: `Crie um briefing de gestão de conta incluindo:
- Objetivo do mês/período
- Temas e pautas prioritárias
- Calendário editorial sugerido
- Tom de voz e linguagem para este período
- Tipos de conteúdo e proporção
- Demandas específicas do cliente
- Pontos de atenção e evitar`,

    site: `Crie um briefing de site/landing page incluindo:
- Objetivo da página
- Público-alvo e intenção de busca
- Estrutura e arquitetura de informação
- Conteúdo necessário (textos, imagens, vídeos)
- Funcionalidades técnicas
- Referências de design
- Requisitos de SEO
- Prazo e fases do projeto`,
  };

  let prompt = `Com base no contexto do cliente e no escopo da entrega, crie um briefing completo do tipo "${type}".`;

  if (designerScope) {
    prompt += `\nEscopo específico do designer: ${designerScope}`;
  }

  prompt += `\n\n${contextText}`;

  if (sprintContext) {
    prompt += `\n\n## Dados do Sprint Atual\n${sprintContext}`;
  }

  if (whatsappDemands) {
    prompt += `\n\n## Demandas Identificadas no WhatsApp\n${whatsappDemands}`;
  }

  prompt += `\n\n${roleSpecificInstructions[type]}

Retorne um JSON com todos os campos do briefing organizados de forma clara e acionável.`;

  return prompt;
}
