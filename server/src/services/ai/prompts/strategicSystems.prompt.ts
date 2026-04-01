/**
 * Prompt builders for each strategic system type (Phase 6).
 *
 * Each exported function returns { systemPrompt, userPrompt } ready to be
 * passed to generateWithRetry / openaiClient.
 */

import type { PromptContext } from '../ai.service';
import type { CohortData } from '../ai.service';

// ── Types ────────────────────────────────────────────────────────────────────

export type StrategicSystemType =
  | 'content_arch'
  | 'format_proportion'
  | 'theme_proportion'
  | 'campaign_structure'
  | 'creatives_per_phase'
  | 'lead_funnel'
  | 'mql_funnel'
  | 'editorial_calendar'
  | 'copy_manual'
  | 'storytelling_storydoing'
  | 'graphic_approach';

// Scopes that make sense for each system type
export const SYSTEM_SCOPE_MAP: Record<StrategicSystemType, string[]> = {
  content_arch: ['social_media', 'campaigns'],
  format_proportion: ['social_media', 'campaigns'],
  theme_proportion: ['social_media', 'campaigns'],
  campaign_structure: ['campaigns', 'trafego'],
  creatives_per_phase: ['campaigns', 'trafego', 'social_media'],
  lead_funnel: ['campaigns', 'trafego', 'social_media'],
  mql_funnel: ['campaigns', 'trafego'],
  editorial_calendar: ['social_media'],
  copy_manual: ['social_media', 'campaigns', 'trafego'],
  storytelling_storydoing: ['social_media', 'campaigns'],
  graphic_approach: ['social_media', 'campaigns'],
};

// ── Shared context assembler ──────────────────────────────────────────────────

function buildContextBlock(ctx: PromptContext): string {
  const parts: string[] = [`# Cliente: ${ctx.clientName}`];
  if (ctx.clientSegment) parts.push(`**Segmento:** ${ctx.clientSegment}`);
  if (ctx.clientServicesScope?.length) {
    parts.push(`**Escopos contratados:** ${ctx.clientServicesScope.join(', ')}`);
  }
  if (ctx.strategy) {
    const s = ctx.strategy;
    if (s.objectives) parts.push(`**Objetivos:** ${s.objectives}`);
    if (s.positioning) parts.push(`**Posicionamento:** ${s.positioning}`);
    if (s.differentials) parts.push(`**Diferenciais:** ${s.differentials}`);
    if (s.tone) parts.push(`**Tom de voz:** ${s.tone}`);
    if (s.products) parts.push(`**Produtos/Serviços:** ${s.products}`);
    if (s.expectedResults) parts.push(`**Resultados esperados:** ${s.expectedResults}`);
  }
  if (ctx.cohorts?.length) {
    parts.push(
      `**Coortes identificadas:**\n${JSON.stringify(ctx.cohorts, null, 2)}`
    );
  }
  return parts.join('\n');
}

function buildCohortsBlock(cohorts: CohortData[]): string {
  return cohorts
    .map(
      (c, i) =>
        `### Coorte ${i + 1}: ${c.characteristicPhrase}\n` +
        `- Descrição: ${c.anthropologicalDescription}\n` +
        `- Comportamento: ${c.behaviorLifestyle}\n` +
        `- Linhas editoriais: ${c.editorialLines.join(', ')}`
    )
    .join('\n\n');
}

// ── 1. content_arch ───────────────────────────────────────────────────────────

export function buildContentArchPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um estrategista de conteúdo digital especializado.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "social_media": {
    "pillars": [
      {
        "name": "Nome do pilar",
        "description": "Descrição do pilar",
        "content_types": ["Reels", "Carrossel"],
        "frequency": "2x por semana"
      }
    ]
  },
  "campaigns": {
    "funnel_stages": [
      {
        "stage": "awareness",
        "content_types": ["Vídeo curto", "Post impulsionado"],
        "messages": ["Mensagem 1", "Mensagem 2"]
      }
    ]
  }
}

Regras:
- Gere 4 a 6 pilares de conteúdo para social_media
- Cubra os 3 estágios do funil: awareness, consideration, conversion em campaigns
- Adapte ao segmento e tom do cliente
- Seja específico, não genérico`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere a Arquitetura de Conteúdo completa para este cliente, cobrindo pilares de redes sociais e estágios de funil em campanhas.`;

  return { systemPrompt, userPrompt };
}

// ── 2. format_proportion ──────────────────────────────────────────────────────

export function buildFormatProportionPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um especialista em estratégia de formatos de conteúdo digital.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "social_media": [
    { "format": "Reels", "percentage": 40, "rationale": "Maior alcance orgânico" }
  ],
  "campaigns": [
    { "format": "Vídeo", "percentage": 50, "rationale": "Melhor performance em conversão" }
  ]
}

Regras:
- Os percentuais de social_media devem somar 100%
- Os percentuais de campaigns devem somar 100%
- Liste de 4 a 7 formatos por canal
- O rationale deve ser específico ao cliente e seu público`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere a Proporção Ideal de Formatos para redes sociais e campanhas pagas para este cliente.`;

  return { systemPrompt, userPrompt };
}

// ── 3. theme_proportion ───────────────────────────────────────────────────────

export function buildThemeProportionPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um estrategista de conteúdo com foco em planejamento editorial.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um array com a seguinte estrutura:
[
  {
    "theme": "Educacional",
    "percentage": 40,
    "description": "Conteúdo que ensina e educa a audiência",
    "examples": ["Como fazer X", "Tutorial sobre Y", "Dica rápida de Z"]
  }
]

Regras:
- Os percentuais devem somar 100%
- Liste de 5 a 8 temas/assuntos
- Cada tema deve ter 2 a 4 exemplos concretos
- Os temas devem refletir os pilares estratégicos do cliente`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere a Proporção Ideal de Assuntos/Temas para a estratégia de conteúdo deste cliente.`;

  return { systemPrompt, userPrompt };
}

// ── 4. campaign_structure ─────────────────────────────────────────────────────

export function buildCampaignStructurePrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um especialista em mídia paga e estrutura de campanhas digitais.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um array com a seguinte estrutura:
[
  {
    "objective": "Awareness — Reconhecimento de marca",
    "funnel_stages": ["Topo do funil"],
    "audience_strategy": "Audiência fria, interesse amplo no segmento",
    "budget_distribution": "30% do orçamento total",
    "timeline": "Sempre ativa, com flight mensal"
  }
]

Regras:
- Crie de 3 a 5 estruturas de campanha por objetivo de negócio
- Cubra pelo menos: awareness, consideração, conversão, retenção
- Seja específico ao segmento do cliente
- Budget distribution deve ser em percentual`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere a Estrutura de Campanhas recomendada para este cliente.`;

  return { systemPrompt, userPrompt };
}

// ── 5. creatives_per_phase ────────────────────────────────────────────────────

export function buildCreativesPerPhasePrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um especialista em criação de anúncios e estratégia de criativos digitais.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um array com a seguinte estrutura:
[
  {
    "phase": "Topo do Funil",
    "formats": ["Vídeo 15s", "Carrossel estático"],
    "messages": ["Problema que o público enfrenta", "Solução disruptiva"],
    "ctas": ["Saiba mais", "Conheça a solução"],
    "audience_cohort": "Audiência fria, interesse no segmento",
    "visual_tone": "Dinâmico, colorido, chamativo"
  }
]

Regras:
- Cubra as 3 fases: Topo, Meio e Fundo do Funil
- Forneça 2 a 4 formatos por fase
- Forneça 2 a 3 mensagens-chave por fase
- Forneça 2 a 3 CTAs por fase
- O visual_tone deve ser específico e descritivo`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere o guia de Criativos por Fase do Funil para este cliente.`;

  return { systemPrompt, userPrompt };
}

// ── 6. lead_funnel ────────────────────────────────────────────────────────────

export function buildLeadFunnelPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um especialista em funis de captação e conversão de leads.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "stages": [
    {
      "stage": "Visitante",
      "conversion_rate": "5-8%",
      "actions": ["Chega via anúncio", "Visita landing page"],
      "drop_off_reasons": ["Página não converte", "Oferta pouco atraente"],
      "optimization_tips": ["Teste A/B no headline", "Vídeo de prova social"]
    }
  ],
  "total_journey": "Descreva o caminho completo do visitante até cliente"
}

Regras:
- Inclua de 5 a 7 estágios do funil: Visitante → Lead → Lead Qualificado → Oportunidade → Cliente
- Forneça taxas de conversão realistas por estágio
- Forneça 2 a 4 ações por estágio
- O total_journey deve ser um parágrafo descritivo`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere o Funil de Leads completo para este cliente, com todas as etapas, taxas de conversão e ações esperadas.`;

  return { systemPrompt, userPrompt };
}

// ── 7. mql_funnel ─────────────────────────────────────────────────────────────

export function buildMqlFunnelPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um especialista em qualificação de leads e processos de MQL (Marketing Qualified Lead).
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "qualification_criteria": [
    {
      "criterion": "Engajamento com conteúdo",
      "weight": "Alto",
      "signals": ["Abriu 3+ emails", "Visitou página de preços"]
    }
  ],
  "nurturing_touchpoints": [
    {
      "touchpoint": "Email de boas-vindas",
      "timing": "Imediato após captação",
      "objective": "Apresentar a marca e gerar engajamento inicial",
      "channel": "Email"
    }
  ],
  "handoff_process": "Descrição do processo de passagem de MQL para o time de vendas"
}

Regras:
- Defina 4 a 6 critérios de qualificação com peso (Alto/Médio/Baixo)
- Mapeie 5 a 8 touchpoints de nutrição em ordem cronológica
- O handoff_process deve ser um parágrafo claro e acionável`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere o Funil de MQL completo para este cliente, incluindo critérios de qualificação, touchpoints de nutrição e processo de handoff para vendas.`;

  return { systemPrompt, userPrompt };
}

// ── 8. editorial_calendar ─────────────────────────────────────────────────────

export function buildEditorialCalendarPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um editor de conteúdo especialista em planejamento editorial para redes sociais.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "weekly_model": [
    {
      "day": "Segunda",
      "content_type": "Educacional",
      "theme": "Dica prática sobre o segmento",
      "cohort": "Coorte principal",
      "format": "Carrossel",
      "platform": "Instagram",
      "responsible": "Social Media"
    }
  ],
  "monthly_model": [
    {
      "week": 1,
      "focus_theme": "Apresentação e autoridade",
      "posts_count": 4,
      "key_dates": ["Datas relevantes da semana"],
      "campaign_alignment": "Topo de funil — reconhecimento"
    }
  ]
}

Regras:
- O weekly_model deve cobrir os 7 dias da semana
- Dias sem publicação devem ter content_type "Descanso" ou "Opcional"
- O monthly_model deve ter exatamente 4 semanas (weeks 1, 2, 3, 4)
- Distribua temas e formatos de forma variada e estratégica`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere o Calendário Editorial (modelo semanal e modelo mensal) para este cliente.`;

  return { systemPrompt, userPrompt };
}

// ── 9. copy_manual ────────────────────────────────────────────────────────────

export function buildCopyManualPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um redator especialista em copywriting e branding verbal para marketing digital.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "voice_guidelines": "Descrição detalhada da voz e tom de comunicação da marca",
  "headline_formulas": [
    "Fórmula 1: [Número] + [Benefício] + [Para quem]",
    "Fórmula 2: Como [Verbo de ação] sem [Objeção principal]"
  ],
  "cta_patterns": [
    "Quero [resultado desejado]",
    "Comece agora →"
  ],
  "vocabulary": {
    "use": ["palavra1", "palavra2", "expressão positiva"],
    "avoid": ["palavra ruim", "jargão excessivo", "expressão negativa"]
  },
  "copy_examples": [
    {
      "type": "social",
      "context": "Post de autoridade no Instagram",
      "example": "Exemplo completo de copy para este tipo"
    }
  ]
}

Regras:
- voice_guidelines deve ter pelo menos 3 parágrafos
- Forneça 5 a 8 fórmulas de headline
- Forneça 6 a 10 padrões de CTA
- vocabulary.use deve ter 10 a 15 itens; avoid deve ter 8 a 12 itens
- Forneça 4 a 6 copy_examples para diferentes contextos (social, email, ads, landing page)`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere o Manual de Copy completo para este cliente, com diretrizes de voz, fórmulas de headline, padrões de CTA, vocabulário e exemplos práticos.`;

  return { systemPrompt, userPrompt };
}

// ── 10. storytelling_storydoing ───────────────────────────────────────────────

export function buildStorytellingStorydoingPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um especialista em narrativa de marca e storytelling estratégico para marketing digital.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "brand_narrative": "Narrativa central da marca em 2-3 parágrafos",
  "story_arc": {
    "hero": "O herói da história (normalmente o cliente/público)",
    "conflict": "O conflito ou problema central que a marca resolve",
    "resolution": "A transformação/resolução que a marca proporciona"
  },
  "key_stories": [
    {
      "title": "Título da história",
      "narrative": "Narrativa completa em 2-3 parágrafos",
      "content_format": "Como adaptar para conteúdo (post, vídeo, stories)"
    }
  ],
  "storydoing_actions": [
    {
      "action": "Ação concreta que a marca pode executar",
      "objective": "Objetivo estratégico desta ação",
      "content_opportunity": "Como transformar em conteúdo"
    }
  ]
}

Regras:
- brand_narrative deve ser autêntica e emocionalmente ressonante
- Forneça 3 a 5 key_stories com narrativas completas
- Forneça 4 a 6 storydoing_actions concretas e executáveis
- As histórias devem conectar com os valores e diferenciais do cliente`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere o Manual de Storytelling e Storydoing para este cliente, com a narrativa central da marca, arco narrativo, histórias-chave e ações concretas.`;

  return { systemPrompt, userPrompt };
}

// ── 11. graphic_approach ──────────────────────────────────────────────────────

export function buildGraphicApproachPrompt(
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Você é um diretor de arte especialista em identidade visual e linguagem gráfica para marketing digital.
Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON.

Retorne um objeto com a seguinte estrutura:
{
  "visual_personality": "Descrição da personalidade visual da marca",
  "color_guidelines": "Diretrizes de uso de cor: paleta primária, secundária e de apoio com orientações de uso",
  "typography_suggestions": "Sugestões de tipografia: fontes para headline, body e destaques",
  "mood_board_references": [
    "Referência visual 1 — marca/estilo de referência",
    "Referência visual 2 — marca/estilo de referência"
  ],
  "dos": [
    "Usar imagens reais do negócio",
    "Manter consistência de paleta em todos os formatos"
  ],
  "donts": [
    "Usar mais de 3 fontes diferentes no mesmo peça",
    "Misturar estilos visuais conflitantes"
  ],
  "style_per_type": [
    {
      "content_type": "Feed Instagram",
      "style": "Descrição detalhada do estilo visual para este formato",
      "color_emphasis": "Cor dominante neste formato",
      "typography_emphasis": "Fonte/peso dominante"
    }
  ]
}

Regras:
- visual_personality deve ter 2 a 3 parágrafos descritivos
- Forneça 3 a 5 referências de mood board (marcas ou estilos conhecidos)
- Forneça 6 a 10 dos e 6 a 10 donts
- Cubra 5 a 7 tipos de conteúdo em style_per_type (Feed, Stories, Reels, Carrossel, Anúncio, etc.)`;

  const userPrompt = `${buildContextBlock(ctx)}

${cohorts?.length ? `## Coortes de Audiência\n${buildCohortsBlock(cohorts)}` : ''}

Gere a Abordagem Gráfica completa para este cliente, com personalidade visual, diretrizes de cor, tipografia, referências e estilos por formato.`;

  return { systemPrompt, userPrompt };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function buildPromptForType(
  type: StrategicSystemType,
  ctx: PromptContext,
  cohorts?: CohortData[]
): { systemPrompt: string; userPrompt: string } {
  switch (type) {
    case 'content_arch':
      return buildContentArchPrompt(ctx, cohorts);
    case 'format_proportion':
      return buildFormatProportionPrompt(ctx, cohorts);
    case 'theme_proportion':
      return buildThemeProportionPrompt(ctx, cohorts);
    case 'campaign_structure':
      return buildCampaignStructurePrompt(ctx, cohorts);
    case 'creatives_per_phase':
      return buildCreativesPerPhasePrompt(ctx, cohorts);
    case 'lead_funnel':
      return buildLeadFunnelPrompt(ctx, cohorts);
    case 'mql_funnel':
      return buildMqlFunnelPrompt(ctx, cohorts);
    case 'editorial_calendar':
      return buildEditorialCalendarPrompt(ctx, cohorts);
    case 'copy_manual':
      return buildCopyManualPrompt(ctx, cohorts);
    case 'storytelling_storydoing':
      return buildStorytellingStorydoingPrompt(ctx, cohorts);
    case 'graphic_approach':
      return buildGraphicApproachPrompt(ctx, cohorts);
  }
}
