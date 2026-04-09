/**
 * Knowledge generation prompts for Groq/Llama (under 128k context).
 * Each prompt generates a specific document type as structured JSON.
 */

export const ONE_PAGE_SUMMARY_PROMPT = `Voce e um analista estrategico da V4 Company. Com base nos dados do cliente fornecidos, gere um One Page Summary completo.

Retorne JSON com esta estrutura:
{
  "overview": "Visao geral do cliente e do projeto em 2-3 paragrafos",
  "objectives": ["objetivo 1", "objetivo 2", ...],
  "services": ["servico contratado 1", "servico 2", ...],
  "stakeholders": ["nome do stakeholder 1", ...],
  "keyMetrics": ["metrica chave 1: descricao", "metrica 2: descricao", ...],
  "timeline": "Timeline resumida do projeto"
}`;

export const COHORT_ANALYSIS_PROMPT = `Voce e um especialista em segmentacao de audiencia da V4 Company. Com base nos dados do cliente, identifique os principais cohorts/segmentos de publico.

Retorne JSON com esta estrutura:
{
  "cohorts": [
    {
      "name": "Nome do cohort",
      "description": "Descricao detalhada do segmento",
      "size": "Tamanho estimado (ex: 30% do publico total)",
      "channels": ["canal preferido 1", "canal 2"],
      "buyingBehavior": "Comportamento de compra",
      "painPoints": ["dor 1", "dor 2"]
    }
  ]
}

Identifique entre 3 e 5 cohorts distintos.`;

export const EMPATHY_MAP_PROMPT = `Voce e um UX researcher da V4 Company. Com base nos dados do cliente, gere um Mapa de Empatia completo para o publico-alvo principal.

Retorne JSON com esta estrutura:
{
  "thinks": ["O que o publico pensa - 4 a 6 itens"],
  "feels": ["O que sente - 4 a 6 itens"],
  "says": ["O que diz - 4 a 6 itens"],
  "does": ["O que faz - 4 a 6 itens"],
  "pains": ["Dores e frustracoes - 4 a 6 itens"],
  "gains": ["Ganhos desejados - 4 a 6 itens"]
}`;

export const BUSINESS_CANVAS_PROMPT = `Voce e um consultor de negocios da V4 Company. Com base nos dados do cliente, gere um Business Model Canvas completo.

Retorne JSON com esta estrutura:
{
  "valueProposition": ["proposta de valor 1", "proposta 2"],
  "customerSegments": ["segmento 1", "segmento 2"],
  "channels": ["canal 1", "canal 2"],
  "customerRelationships": ["tipo de relacionamento 1"],
  "revenueStreams": ["fonte de receita 1"],
  "keyResources": ["recurso chave 1"],
  "keyActivities": ["atividade chave 1"],
  "keyPartners": ["parceiro chave 1"],
  "costStructure": ["estrutura de custo 1"]
}`;

export const PERSONA_PROMPT = `Voce e um estrategista de marketing da V4 Company. Com base nos dados do cliente, crie personas detalhadas para o publico-alvo.

Retorne JSON com esta estrutura:
{
  "personas": [
    {
      "name": "Nome ficticio representativo",
      "age": "Faixa etaria",
      "occupation": "Ocupacao/profissao",
      "goals": ["objetivo 1", "objetivo 2"],
      "frustrations": ["frustracao 1", "frustracao 2"],
      "channels": ["canal preferido 1", "canal 2"],
      "quote": "Frase que essa persona diria"
    }
  ]
}

Crie 2 a 4 personas distintas.`;

export const ARCHETYPE_PROMPT = `Voce e um branding strategist da V4 Company. Com base nos dados do cliente, identifique o arquetipo de marca mais adequado.

Retorne JSON com esta estrutura:
{
  "primaryArchetype": "Nome do arquetipo principal (ex: O Heroi, O Sabio, O Explorador)",
  "description": "Descricao de como esse arquetipo se manifesta na marca",
  "secondaryArchetype": "Arquetipo secundario",
  "tone": "Tom de voz decorrente do arquetipo",
  "visualDirection": "Direcao visual sugerida",
  "contentPillars": ["pilar de conteudo 1", "pilar 2", "pilar 3"],
  "avoidances": ["o que evitar na comunicacao 1", "evitar 2"]
}`;

export const COPY_MANUAL_PROMPT = `Voce e um copywriter senior da V4 Company. Com base nos dados do cliente, crie um manual de copy.

Retorne JSON com esta estrutura:
{
  "brandVoice": "Descricao da voz da marca em 2-3 paragrafos",
  "toneGuidelines": ["diretriz de tom 1", "diretriz 2"],
  "keyPhrases": ["frase-chave da marca 1", "frase 2"],
  "avoidPhrases": ["frase a evitar 1", "frase 2"],
  "headlineFormulas": ["formula de headline 1", "formula 2"],
  "ctaExamples": ["exemplo de CTA 1", "CTA 2"],
  "socialMediaGuidelines": {
    "instagram": "Diretriz para Instagram",
    "linkedin": "Diretriz para LinkedIn",
    "ads": "Diretriz para anuncios"
  }
}`;

export const COMPETITIVE_SCENARIO_PROMPT = `Voce e um analista de mercado da V4 Company. Com base nos dados do cliente, analise o cenario competitivo.

Retorne JSON com esta estrutura:
{
  "positioning": "Posicionamento atual e recomendado em 2-3 paragrafos",
  "competitors": [
    {
      "name": "Nome do concorrente",
      "strengths": ["forca 1", "forca 2"],
      "weaknesses": ["fraqueza 1", "fraqueza 2"]
    }
  ],
  "opportunities": ["oportunidade de mercado 1", "oportunidade 2"],
  "threats": ["ameaca 1", "ameaca 2"],
  "differentiationStrategy": "Estrategia de diferenciacao recomendada"
}`;

export const MARKET_ANALYSIS_PROMPT = `Voce e um analista de mercado da V4 Company. Com base nos dados do cliente, faca uma analise de mercado.

Retorne JSON com esta estrutura:
{
  "marketSize": "Tamanho estimado do mercado",
  "growthRate": "Taxa de crescimento do setor",
  "trends": ["tendencia 1", "tendencia 2", "tendencia 3"],
  "targetMarketCharacteristics": "Caracteristicas do mercado-alvo",
  "entryBarriers": ["barreira 1", "barreira 2"],
  "regulatoryFactors": ["fator regulatorio 1"],
  "digitalMaturity": "Nivel de maturidade digital do setor",
  "recommendations": ["recomendacao estrategica 1", "recomendacao 2"]
}`;

export const BENCHMARKING_PROMPT = `Voce e um analista de benchmarking da V4 Company. Com base nos dados do cliente, faca uma analise de benchmarking.

Retorne JSON com esta estrutura:
{
  "industryBenchmarks": [
    {"metric": "nome da metrica", "industryAvg": "valor medio", "clientTarget": "meta sugerida"}
  ],
  "bestPractices": ["pratica recomendada 1", "pratica 2"],
  "gapAnalysis": ["gap identificado 1: descricao e recomendacao"],
  "quickWins": ["quick win 1", "quick win 2"],
  "longTermGoals": ["meta de longo prazo 1", "meta 2"]
}`;

/** Map doc type to its generation prompt */
export const KNOWLEDGE_PROMPTS: Record<string, string> = {
  one_page_summary: ONE_PAGE_SUMMARY_PROMPT,
  cohort_analysis: COHORT_ANALYSIS_PROMPT,
  empathy_map: EMPATHY_MAP_PROMPT,
  business_canvas: BUSINESS_CANVAS_PROMPT,
  persona: PERSONA_PROMPT,
  archetype: ARCHETYPE_PROMPT,
  copy_manual: COPY_MANUAL_PROMPT,
  competitive_scenario: COMPETITIVE_SCENARIO_PROMPT,
  market_analysis: MARKET_ANALYSIS_PROMPT,
  benchmarking: BENCHMARKING_PROMPT,
};
