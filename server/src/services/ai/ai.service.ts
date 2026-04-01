import { getOpenAIClient, OPENAI_MODELS } from '../../config/openai';

// Lazy accessor — resolves on first use so env vars are available at runtime
const openaiClient = { get client() { return getOpenAIClient(); } };
import { ZodSchema, z } from 'zod';
import { logger } from '../../utils/logger';
import { Response } from 'express';
import { GAP_DETECTION_PROMPT } from './prompts/gapDetection.prompt';
import { TRANSCRIPT_HIGHLIGHT_PROMPT } from './prompts/transcriptHighlight.prompt';
import { SUMMARY_PROMPT } from './prompts/summary.prompt';
import {
  COHORTS_SYSTEM_PROMPT,
  buildCohortsUserPrompt,
  EMPATHY_MAP_SYSTEM_PROMPT,
  buildEmpathyMapUserPrompt,
} from './prompts/cohorts.prompt';
import {
  buildPromptForType,
  StrategicSystemType,
  SYSTEM_SCOPE_MAP,
} from './prompts/strategicSystems.prompt';
import { TRANSCRIPT_EXTRACTION_PROMPT } from './prompts/extraction.prompt';

// ── Phase 3 domain types ──────────────────────────────────────────────────────
export interface GapItem {
  field: string;
  severity: 'high' | 'medium' | 'low';
  suggested_question: string;
}

export interface HighlightItem {
  excerpt: string;
  relevance: string;
  meeting_type: 'kickoff' | 'checkin' | null;
  recorded_at: string | null;
}

export interface PromptContext {
  clientName: string;
  clientSegment?: string;
  clientServicesScope?: string[];
  strategy?: {
    objectives?: string;
    positioning?: string;
    differentials?: string;
    tone?: string;
    products?: string;
    expectedResults?: string;
  };
  summaryJson?: Record<string, unknown>;
  brandProfileJson?: Record<string, unknown>;
  meetingTranscripts?: string[];
  cohorts?: Array<Record<string, unknown>>;
  sprintData?: Array<Record<string, unknown>>;
  whatsappMessages?: string[];
  campaignReports?: Array<Record<string, unknown>>;
}

export function assembleContext(ctx: PromptContext): string {
  const parts: string[] = [];

  parts.push(`# Cliente: ${ctx.clientName}`);

  if (ctx.clientSegment) {
    parts.push(`## Segmento: ${ctx.clientSegment}`);
  }

  if (ctx.clientServicesScope?.length) {
    parts.push(`## Escopos de Serviço: ${ctx.clientServicesScope.join(', ')}`);
  }

  if (ctx.strategy) {
    parts.push('## Estratégia');
    if (ctx.strategy.objectives) parts.push(`### Objetivos\n${ctx.strategy.objectives}`);
    if (ctx.strategy.positioning) parts.push(`### Posicionamento\n${ctx.strategy.positioning}`);
    if (ctx.strategy.differentials) parts.push(`### Diferenciais\n${ctx.strategy.differentials}`);
    if (ctx.strategy.tone) parts.push(`### Tom de Voz\n${ctx.strategy.tone}`);
    if (ctx.strategy.products) parts.push(`### Produtos/Serviços\n${ctx.strategy.products}`);
    if (ctx.strategy.expectedResults) parts.push(`### Resultados Esperados\n${ctx.strategy.expectedResults}`);
  }

  if (ctx.meetingTranscripts?.length) {
    parts.push('## Transcrições de Reuniões');
    ctx.meetingTranscripts.forEach((t, i) => {
      parts.push(`### Reunião ${i + 1}\n${t}`);
    });
  }

  if (ctx.summaryJson && Object.keys(ctx.summaryJson).length > 0) {
    parts.push(`## One Page Summary\n${JSON.stringify(ctx.summaryJson, null, 2)}`);
  }

  if (ctx.cohorts?.length) {
    parts.push(`## Coortes Identificadas\n${JSON.stringify(ctx.cohorts, null, 2)}`);
  }

  if (ctx.sprintData?.length) {
    parts.push(`## Dados de Sprint\n${JSON.stringify(ctx.sprintData, null, 2)}`);
  }

  if (ctx.whatsappMessages?.length) {
    parts.push('## Mensagens WhatsApp Recentes');
    ctx.whatsappMessages.forEach((m) => parts.push(`- ${m}`));
  }

  if (ctx.campaignReports?.length) {
    parts.push(`## Relatórios de Campanha\n${JSON.stringify(ctx.campaignReports, null, 2)}`);
  }

  return parts.join('\n\n');
}

export async function generateWithRetry<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  model: string = OPENAI_MODELS.GPT4O,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (!openaiClient.client) throw new Error('OpenAI client not configured');
      const response = await openaiClient.client!.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as unknown;
      const validated = schema.parse(parsed);
      return validated;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`AI generation attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('AI generation failed after retries');
}

export async function generateStream(
  systemPrompt: string,
  userPrompt: string,
  model: string = OPENAI_MODELS.GPT4O
): Promise<AsyncIterable<string>> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const stream = await openaiClient.client!.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: true,
    temperature: 0.7,
  });

  async function* textStream(): AsyncIterable<string> {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  return textStream();
}

// ── Phase 4: Summary & Brand Profile ─────────────────────────────────────────

export interface SummaryJSON {
  contracted_scope: string;
  client_needs: string;
  kpis: Array<{ metric: string; target: string }>;
  success_indicator: string;
  target_audience: string;
  objectives: string;
  extra_details: string;
}

export interface BrandProfileJSON {
  positioning: string;
  personality: string;
  tone_of_voice: string;
  visual_identity_notes: string;
  brand_promise: string;
  differentiators: string;
  archetype: string | null;
}

const kpiSchema = z.object({ metric: z.string(), target: z.string() });

const summaryJsonSchema = z.object({
  contracted_scope: z.string(),
  client_needs: z.string(),
  kpis: z.array(kpiSchema),
  success_indicator: z.string(),
  target_audience: z.string(),
  objectives: z.string(),
  extra_details: z.string(),
});

const brandProfileJsonSchema = z.object({
  positioning: z.string(),
  personality: z.string(),
  tone_of_voice: z.string(),
  visual_identity_notes: z.string(),
  brand_promise: z.string(),
  differentiators: z.string(),
  archetype: z.string().nullable(),
});

const summaryResponseSchema = z.object({
  summary: summaryJsonSchema,
  brand_profile: brandProfileJsonSchema,
});

const MOCK_SUMMARY: SummaryJSON = {
  contracted_scope: 'Gestão de redes sociais, tráfego pago e produção de conteúdo',
  client_needs: 'Aumentar presença digital, gerar leads qualificados e fortalecer a marca',
  kpis: [
    { metric: 'Leads mensais', target: '50 leads/mês' },
    { metric: 'Alcance orgânico', target: '10.000 impressões/mês' },
    { metric: 'Taxa de conversão', target: '3%' },
  ],
  success_indicator: 'Aumento consistente de vendas provenientes do digital',
  target_audience: 'Empreendedores e pequenas empresas da região metropolitana, 25-45 anos',
  objectives: 'Consolidar presença digital, aumentar reconhecimento de marca e gerar oportunidades de negócio',
  extra_details: 'Cliente novo, com histórico de marketing tradicional. Prefere comunicação direta e objetiva.',
};

const MOCK_BRAND_PROFILE: BrandProfileJSON = {
  positioning: 'Marca referência em soluções práticas para o mercado local, com atendimento personalizado e resultados mensuráveis.',
  personality: 'Confiável, próximo, profissional e inovador',
  tone_of_voice: 'Direto, acolhedor e especialista — sem jargão excessivo',
  visual_identity_notes: 'Paleta sóbria com tons de azul e branco. Logo clean. Preferência por imagens reais do negócio.',
  brand_promise: 'Entregas que geram resultados reais, com transparência em cada etapa',
  differentiators: 'Atendimento humanizado, relatórios claros e estratégias adaptadas ao negócio do cliente',
  archetype: 'O Cuidador',
};

export async function generateSummary(
  context: PromptContext
): Promise<{ summary: SummaryJSON; brand_profile: BrandProfileJSON }> {
  if (!openaiClient.client) {
    logger.warn('OpenAI not configured — returning mock summary data');
    return { summary: MOCK_SUMMARY, brand_profile: MOCK_BRAND_PROFILE };
  }

  const contextText = assembleContext(context);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await openaiClient.client!.chat.completions.create({
        model: OPENAI_MODELS.GPT4O,
        messages: [
          { role: 'system', content: SUMMARY_PROMPT },
          { role: 'user', content: contextText },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as unknown;
      const validated = summaryResponseSchema.parse(parsed);
      return { summary: validated.summary, brand_profile: validated.brand_profile };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`generateSummary attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  logger.error('generateSummary failed after retries — returning mock data');
  return { summary: MOCK_SUMMARY, brand_profile: MOCK_BRAND_PROFILE };
}

// ── Phase 3: Gap detection ────────────────────────────────────────────────────

const MOCK_GAPS: GapItem[] = [
  {
    field: 'objectives',
    severity: 'high',
    suggested_question: 'Quais são as métricas quantitativas de sucesso para os próximos 3 meses?',
  },
];

export async function detectGaps(
  context: PromptContext,
  strategyFields: Record<string, string>
): Promise<GapItem[]> {
  if (!openaiClient.client) {
    logger.warn('OpenAI not configured — returning mock gaps');
    return MOCK_GAPS;
  }

  const contextText = assembleContext(context);
  const fieldsText = Object.entries(strategyFields)
    .map(([k, v]) => `## ${k}\n${v}`)
    .join('\n\n');

  const userPrompt = `${contextText}\n\n## Strategy Fields\n${fieldsText}`;

  try {
    const response = await openaiClient.client!.chat.completions.create({
      model: OPENAI_MODELS.GPT4O_MINI,
      messages: [
        { role: 'system', content: GAP_DETECTION_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content ?? '[]';
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) return MOCK_GAPS;
    return parsed as GapItem[];
  } catch (err) {
    logger.error('detectGaps failed:', err);
    return MOCK_GAPS;
  }
}

// ── Phase 3: Transcript highlights (non-streaming) ────────────────────────────

const MOCK_HIGHLIGHTS: HighlightItem[] = [
  {
    excerpt: 'O cliente mencionou que deseja aumentar o reconhecimento da marca no mercado local.',
    relevance: 'Directly relates to the strategy objectives field.',
    meeting_type: 'kickoff',
    recorded_at: null,
  },
  {
    excerpt: 'Precisamos comunicar nosso diferencial de atendimento personalizado.',
    relevance: 'Relevant to positioning and differentials.',
    meeting_type: 'kickoff',
    recorded_at: null,
  },
  {
    excerpt: 'A meta é dobrar as vendas online em 6 meses.',
    relevance: 'Relates to expected results and objectives.',
    meeting_type: 'checkin',
    recorded_at: null,
  },
];

export async function getTranscriptHighlights(
  context: PromptContext,
  fieldName: string
): Promise<HighlightItem[]> {
  if (!openaiClient.client) {
    logger.warn('OpenAI not configured — returning mock highlights');
    return MOCK_HIGHLIGHTS;
  }

  const transcripts = context.meetingTranscripts ?? [];
  if (transcripts.length === 0) {
    return MOCK_HIGHLIGHTS;
  }

  const transcriptText = transcripts
    .map((t, i) => `### Transcript ${i + 1}\n${t}`)
    .join('\n\n');

  const userPrompt = `Field: ${fieldName}\n\nClient: ${context.clientName}\n\n${transcriptText}`;

  try {
    const response = await openaiClient.client!.chat.completions.create({
      model: OPENAI_MODELS.GPT4O_MINI,
      messages: [
        { role: 'system', content: TRANSCRIPT_HIGHLIGHT_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '[]';
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) return MOCK_HIGHLIGHTS;
    return (parsed as HighlightItem[]).slice(0, 3);
  } catch (err) {
    logger.error('getTranscriptHighlights failed:', err);
    return MOCK_HIGHLIGHTS;
  }
}

// ── Phase 3: Transcript highlights (SSE streaming) ────────────────────────────

export async function streamTranscriptHighlights(
  context: PromptContext,
  fieldName: string,
  res: Response
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!openaiClient.client) {
    logger.warn('OpenAI not configured — streaming mock highlights');
    const mock = JSON.stringify(MOCK_HIGHLIGHTS);
    res.write(`data: ${JSON.stringify({ text: mock })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const transcripts = context.meetingTranscripts ?? [];
  const transcriptText =
    transcripts.length > 0
      ? transcripts.map((t, i) => `### Transcript ${i + 1}\n${t}`).join('\n\n')
      : '(no transcripts available)';

  const userPrompt = `Field: ${fieldName}\n\nClient: ${context.clientName}\n\n${transcriptText}`;

  try {
    const stream = await openaiClient.client!.chat.completions.create({
      model: OPENAI_MODELS.GPT4O_MINI,
      messages: [
        { role: 'system', content: TRANSCRIPT_HIGHLIGHT_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    logger.error('streamTranscriptHighlights failed:', err);
    const mock = JSON.stringify(MOCK_HIGHLIGHTS);
    res.write(`data: ${JSON.stringify({ text: mock })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// ── Phase 5: Cohort generation ────────────────────────────────────────────────

export interface DemographicProfileData {
  ageRange: string;
  gender: string;
  location: string;
  income: string;
  education: string;
  occupation: string;
  familySituation: string;
}

export interface CohortData {
  characteristicPhrase: string;
  anthropologicalDescription: string;
  demographicProfile: DemographicProfileData;
  behaviorLifestyle: string;
  audienceSize: string;
  reachPotential: string;
  triggers: string[];
  alternativeSolutions: string[];
  indicators: string[];
  editorialLines: string[];
}

export interface EmpathyMapData {
  pensa_sente: string;
  ve: string;
  ouve: string;
  fala_faz: string;
  dores: string;
  ganhos: string;
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const demographicProfileSchema = z.object({
  ageRange: z.string(),
  gender: z.string(),
  location: z.string(),
  income: z.string(),
  education: z.string(),
  occupation: z.string(),
  familySituation: z.string(),
});

const cohortDataSchema = z.object({
  characteristicPhrase: z.string(),
  anthropologicalDescription: z.string(),
  demographicProfile: demographicProfileSchema,
  behaviorLifestyle: z.string(),
  audienceSize: z.string(),
  reachPotential: z.string(),
  triggers: z.array(z.string()),
  alternativeSolutions: z.array(z.string()),
  indicators: z.array(z.string()),
  editorialLines: z.array(z.string()),
});

const cohortsResponseSchema = z.object({
  cohorts: z.array(cohortDataSchema).min(1),
});

const empathyMapSchema = z.object({
  pensa_sente: z.string(),
  ve: z.string(),
  ouve: z.string(),
  fala_faz: z.string(),
  dores: z.string(),
  ganhos: z.string(),
});

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_COHORTS: CohortData[] = [
  {
    characteristicPhrase: 'O empreendedor local que quer crescer no digital sem complicação',
    anthropologicalDescription:
      'Empresário com negócio estabelecido há mais de 5 anos no mercado local. Cresceu vendo seus pais trabalharem com comércio e herdou o instinto de venda presencial. Reconhece que o digital é inevitável, mas sente insegurança com o vocabulário técnico e teme investir sem retorno claro. Valoriza relacionamentos de longo prazo e prefere fornecedores que "entendem o seu negócio". Sua maior frustração é ver concorrentes crescerem online enquanto ele ainda depende de indicações.',
    demographicProfile: {
      ageRange: '35-50 anos',
      gender: 'Masculino (60%) / Feminino (40%)',
      location: 'Capitais e cidades médias do interior',
      income: 'R$ 8.000 - R$ 25.000/mês',
      education: 'Ensino médio completo ou graduação incompleta',
      occupation: 'Proprietário de pequena empresa, comerciante',
      familySituation: 'Casado(a), 1-3 filhos',
    },
    behaviorLifestyle:
      'Acorda cedo, trabalha longas horas no negócio. Usa WhatsApp como principal canal de comunicação. Consome conteúdo no YouTube e Instagram sobre negócios e mercado. Desconfia de soluções muito automatizadas. Prefere reuniões presenciais ou videochamadas.',
    audienceSize: '3-6 milhões de pessoas no Brasil',
    reachPotential: 'Alto — 40-70k alcance mensal estimado',
    triggers: [
      'Ver um concorrente direto crescer nas redes sociais',
      'Perder um cliente para uma empresa com presença digital forte',
      'Receber indicação de um colega sobre resultados com marketing digital',
    ],
    alternativeSolutions: [
      'Contratar freelancer pontualmente sem estratégia',
      'Tentar fazer as redes sociais ele mesmo com a equipe',
    ],
    indicators: [
      'Pesquisa "agência de marketing" no Google',
      'Segue perfis de cases de sucesso em marketing digital',
      'Participa de grupos de empresários no WhatsApp',
    ],
    editorialLines: [
      'Cases reais de clientes do mesmo segmento',
      'Conteúdo educativo sobre métricas e ROI digital',
      'Bastidores e processo de trabalho da agência',
    ],
  },
  {
    characteristicPhrase: 'A profissional liberal que quer construir sua autoridade online',
    anthropologicalDescription:
      'Médica, advogada, psicóloga ou arquiteta que investe na própria marca pessoal. Tem diploma e expertise consolidada, mas percebe que o mercado valoriza quem é visto online. Já tentou fazer as próprias redes sociais, mas falta tempo e consistência. Sente que precisa de alguém de confiança que entenda o tom correto para sua área — não quer parecer apelativa ou comprometer sua reputação profissional. Valoriza muito a curadoria do conteúdo e a estética visual.',
    demographicProfile: {
      ageRange: '28-42 anos',
      gender: 'Feminino (65%) / Masculino (35%)',
      location: 'Capitais e regiões metropolitanas',
      income: 'R$ 12.000 - R$ 35.000/mês',
      education: 'Pós-graduação ou especialização',
      occupation: 'Profissional liberal autônomo ou em consultório próprio',
      familySituation: 'Solteira ou casada sem filhos, ou com filhos pequenos',
    },
    behaviorLifestyle:
      'Rotina intensa e agenda cheia. Consome podcasts durante deslocamentos. Está no Instagram e LinkedIn. Compra cursos online e investe em desenvolvimento profissional. Valoriza design e estética. Lê conteúdo sobre tendências da própria área e sobre empreendedorismo feminino.',
    audienceSize: '1,5-3 milhões de pessoas no Brasil',
    reachPotential: 'Médio-Alto — 20-40k alcance mensal estimado',
    triggers: [
      'Ver colega de profissão lotar a agenda com clientes vindos do Instagram',
      'Receber elogio de paciente/cliente que chegou pelo Instagram',
      'Sentir que está ficando para trás enquanto o mercado se digitaliza',
    ],
    alternativeSolutions: [
      'Pedir para um familiar ou assistente cuidar das redes sociais',
      'Comprar templates no Canva e postar de forma irregular',
    ],
    indicators: [
      'Segue perfis de mentores de marketing para profissionais liberais',
      'Pesquisa "como atrair pacientes pelo Instagram"',
      'Comentou em posts de colegas sobre marketing digital para a área',
    ],
    editorialLines: [
      'Posicionamento de autoridade e educação sobre a área de atuação',
      'Bastidores humanizados da rotina profissional',
      'Conteúdo sobre o impacto do trabalho na vida dos clientes/pacientes',
    ],
  },
  {
    characteristicPhrase: 'A marca em crescimento que quer escalar sem perder a essência',
    anthropologicalDescription:
      'Empresa fundada há 2-5 anos que saiu do estágio inicial e agora precisa de uma estratégia de crescimento sustentável. Os fundadores ainda se envolvem no dia a dia do marketing, mas percebem que chegou o momento de profissionalizar. Já têm uma base de clientes fiéis e uma identidade de marca que funciona, mas sentem que o crescimento emperrou. Buscam um parceiro estratégico, não apenas um executor — alguém que entenda onde eles querem chegar.',
    demographicProfile: {
      ageRange: '25-38 anos (fundadores)',
      gender: 'Distribuído',
      location: 'Grandes centros urbanos',
      income: 'Faturamento empresarial R$ 50k-300k/mês',
      education: 'Superior completo, muitos com MBA ou pós',
      occupation: 'Fundador, CEO, sócio de startup ou empresa em crescimento',
      familySituation: 'Variado',
    },
    behaviorLifestyle:
      'Consome conteúdo de negócios intensamente: podcasts, newsletters, grupos no Slack. Está no LinkedIn profissionalmente e no Instagram pessoalmente. Tem familiaridade com métricas e ferramentas digitais. Já leu livros de marketing e crescimento. Participa de eventos e aceleradoras.',
    audienceSize: '500k-1,5 milhões de empresas no Brasil',
    reachPotential: 'Médio — 15-30k alcance mensal estimado',
    triggers: [
      'Sentir que a estratégia atual chegou no teto de crescimento',
      'Ter perdido um grande cliente para um concorrente mais visível',
      'Receber aporte ou ter capital para investir em marketing profissional',
    ],
    alternativeSolutions: [
      'Contratar um profissional de marketing CLT interno',
      'Dividir tarefas de marketing entre os sócios',
    ],
    indicators: [
      'Pesquisa "agência de growth" ou "consultoria de marketing digital"',
      'Pede indicações no LinkedIn para agências ou profissionais',
      'Lê cases de empresas similares que escalaram com marketing',
    ],
    editorialLines: [
      'Estratégia e cases de crescimento de marcas em escala',
      'Conteúdo sobre construção de brand equity e posicionamento',
      'Dados e benchmarks do mercado com análise estratégica',
    ],
  },
];

const MOCK_EMPATHY_MAP: EmpathyMapData = {
  pensa_sente:
    'Sente que está ficando para trás enquanto o mundo digital avança. Tem medo de investir e não ver retorno. Por dentro, acredita que seu produto/serviço é bom, mas se pergunta por que não está crescendo mais. Aspira a ter reconhecimento no mercado e a sentir que seu trabalho está valendo a pena. Tem orgulho do que construiu e quer que o mundo saiba disso.',
  ve: 'Vê concorrentes crescendo nas redes sociais com conteúdo profissional. Vê anúncios de agências e gurus de marketing por toda parte. Vê clientes cada vez mais influenciados pelo digital antes de tomar decisões. Seu feed é cheio de cases de sucesso e transformações digitais de outros negócios.',
  ouve:
    'Ouve de amigos e colegas que "quem não está no digital não existe". Ouve de clientes que chegaram por indicação que gostariam de ver mais sobre o negócio nas redes. Ouve podcasts de negócios e empreendedorismo. A mídia e influenciadores digitais de sua área falam constantemente sobre marketing de conteúdo.',
  fala_faz:
    'Fala que "precisa organizar o marketing" mas adia a decisão. Faz pesquisas no Google sobre agências e marketing digital. Segue perfis de referência em sua área no Instagram. Comenta em posts de negócios com dúvidas. Nas redes, posta de forma irregular e sem consistência quando tem tempo.',
  dores:
    'Frustração com a inconsistência das próprias redes sociais. Medo de ser enganado por agências sem resultado. Dificuldade em entender o vocabulário técnico de marketing digital. Sensação de que está perdendo clientes para concorrentes mais visíveis. Falta de tempo para se dedicar ao marketing enquanto gerencia o negócio.',
  ganhos:
    'Quer ver o negócio crescendo de forma previsível com clientes vindo do digital. Quer ter uma marca reconhecida e respeitada em sua área. Quer poder focar no que faz bem (o negócio principal) sabendo que o marketing está nas mãos certas. Quer métricas claras que mostrem que o investimento está valendo a pena.',
};

// ── generateCohorts ───────────────────────────────────────────────────────────

export async function generateCohorts(context: PromptContext): Promise<CohortData[]> {
  if (!openaiClient.client) {
    logger.warn('OpenAI not configured — returning mock cohort data');
    return MOCK_COHORTS;
  }

  const contextText = assembleContext(context);
  const userPrompt = buildCohortsUserPrompt(contextText, 3);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openaiClient.client!.chat.completions.create({
        model: OPENAI_MODELS.GPT4O,
        messages: [
          { role: 'system', content: COHORTS_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as unknown;
      const validated = cohortsResponseSchema.parse(parsed);

      if (validated.cohorts.length < 3) {
        throw new Error(`Only ${validated.cohorts.length} cohorts returned — minimum is 3`);
      }

      return validated.cohorts;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`generateCohorts attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  logger.error('generateCohorts failed after retries — returning mock data');
  return MOCK_COHORTS;
}

// ── generateEmpathyMap ────────────────────────────────────────────────────────

export async function generateEmpathyMap(cohort: CohortData): Promise<EmpathyMapData> {
  if (!openaiClient.client) {
    logger.warn('OpenAI not configured — returning mock empathy map');
    return MOCK_EMPATHY_MAP;
  }

  const userPrompt = buildEmpathyMapUserPrompt({
    characteristicPhrase: cohort.characteristicPhrase,
    anthropologicalDescription: cohort.anthropologicalDescription,
    demographicProfile: cohort.demographicProfile as unknown as Record<string, string>,
    behaviorLifestyle: cohort.behaviorLifestyle,
    triggers: cohort.triggers,
    alternativeSolutions: cohort.alternativeSolutions,
    indicators: cohort.indicators,
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await openaiClient.client!.chat.completions.create({
        model: OPENAI_MODELS.GPT4O,
        messages: [
          { role: 'system', content: EMPATHY_MAP_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as unknown;
      return empathyMapSchema.parse(parsed);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`generateEmpathyMap attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  logger.error('generateEmpathyMap failed after retries — returning mock data');
  return MOCK_EMPATHY_MAP;
}

// ── Phase 6: Strategic Systems ────────────────────────────────────────────────

// Re-export types for consumers
export type { StrategicSystemType } from './prompts/strategicSystems.prompt';
export { SYSTEM_SCOPE_MAP } from './prompts/strategicSystems.prompt';

/**
 * Returns mock data for a given strategic system type.
 * Used when OpenAI is not configured.
 */
function getMockStrategicSystem(type: StrategicSystemType): unknown {
  switch (type) {
    case 'content_arch':
      return {
        social_media: {
          pillars: [
            {
              name: 'Educação e Valor',
              description: 'Conteúdo que ensina e posiciona a marca como referência',
              content_types: ['Carrossel', 'Reels educativos', 'Posts informativos'],
              frequency: '3x por semana',
            },
            {
              name: 'Prova Social',
              description: 'Cases, depoimentos e resultados reais de clientes',
              content_types: ['Stories', 'Reels', 'Posts com depoimento'],
              frequency: '2x por semana',
            },
            {
              name: 'Bastidores',
              description: 'Humanização da marca mostrando o processo e a equipe',
              content_types: ['Stories', 'Reels curtos'],
              frequency: '1x por semana',
            },
            {
              name: 'Oferta e Conversão',
              description: 'Conteúdo de venda direta e chamadas para ação',
              content_types: ['Posts de oferta', 'Stories com CTA', 'Reels de produto'],
              frequency: '2x por semana',
            },
          ],
        },
        campaigns: {
          funnel_stages: [
            {
              stage: 'awareness',
              content_types: ['Vídeo 15-30s', 'Post impulsionado'],
              messages: ['Descubra como resolver [problema principal]', 'Você sabia que [insight do segmento]?'],
            },
            {
              stage: 'consideration',
              content_types: ['Carrossel de benefícios', 'Vídeo de prova social'],
              messages: ['Veja como nossos clientes transformaram seus resultados', 'Compare as soluções disponíveis no mercado'],
            },
            {
              stage: 'conversion',
              content_types: ['Post de oferta', 'Vídeo de produto/serviço'],
              messages: ['Comece agora com condições especiais', 'Últimas vagas disponíveis'],
            },
          ],
        },
      };

    case 'format_proportion':
      return {
        social_media: [
          { format: 'Reels', percentage: 35, rationale: 'Maior alcance orgânico e engajamento na plataforma' },
          { format: 'Carrossel', percentage: 30, rationale: 'Alta retenção e compartilhamento, ideal para conteúdo educativo' },
          { format: 'Post estático', percentage: 20, rationale: 'Comunicação direta e rápida para datas e ofertas' },
          { format: 'Stories', percentage: 15, rationale: 'Relacionamento próximo e CTAs diretos' },
        ],
        campaigns: [
          { format: 'Vídeo (6-15s)', percentage: 40, rationale: 'Melhor performance em reconhecimento e custo por reach' },
          { format: 'Imagem estática', percentage: 30, rationale: 'Custo-benefício elevado para conversão' },
          { format: 'Carrossel', percentage: 20, rationale: 'Melhor para educação e produtos múltiplos' },
          { format: 'Vídeo longo (30-60s)', percentage: 10, rationale: 'Retargeting e audiência quente' },
        ],
      };

    case 'theme_proportion':
      return [
        { theme: 'Educacional', percentage: 35, description: 'Conteúdo que ensina e gera valor para a audiência', examples: ['Dicas práticas', 'Tutoriais', 'Como fazer X'] },
        { theme: 'Inspiração e Motivação', percentage: 20, description: 'Conteúdo emocional que conecta com os valores da audiência', examples: ['Frases impactantes', 'Cases de superação', 'Visão de futuro'] },
        { theme: 'Prova Social', percentage: 20, description: 'Depoimentos, resultados e cases reais', examples: ['Depoimentos de clientes', 'Antes e depois', 'Métricas de resultado'] },
        { theme: 'Produto e Serviço', percentage: 15, description: 'Apresentação direta do que a marca oferece', examples: ['Demonstrações', 'Features', 'Comparativos'] },
        { theme: 'Institucional e Bastidores', percentage: 10, description: 'Humanização da marca e cultura organizacional', examples: ['Equipe', 'Processo de trabalho', 'Valores da empresa'] },
      ];

    case 'campaign_structure':
      return [
        {
          objective: 'Awareness — Reconhecimento de Marca',
          funnel_stages: ['Topo do funil'],
          audience_strategy: 'Audiência fria, segmentada por interesse no segmento e comportamento de consumo',
          budget_distribution: '25% do orçamento mensal',
          timeline: 'Campanha sempre ativa com revisão mensal',
        },
        {
          objective: 'Consideração — Geração de Leads',
          funnel_stages: ['Meio do funil'],
          audience_strategy: 'Remarketing de quem engajou com conteúdo + lookalike de base de clientes',
          budget_distribution: '40% do orçamento mensal',
          timeline: 'Campanha sempre ativa com testes A/B quinzenais',
        },
        {
          objective: 'Conversão — Vendas e Cadastros',
          funnel_stages: ['Fundo do funil'],
          audience_strategy: 'Remarketing quente: visitantes do site, engajamento alto, lista de leads',
          budget_distribution: '35% do orçamento mensal',
          timeline: 'Ativa durante o mês com picos em datas sazonais',
        },
      ];

    case 'creatives_per_phase':
      return [
        {
          phase: 'Topo do Funil',
          formats: ['Vídeo 15s', 'Post impulsionado estático'],
          messages: ['Identificação com o problema da audiência', 'Apresentação da solução de forma leve'],
          ctas: ['Saiba mais', 'Conheça a solução'],
          audience_cohort: 'Audiência fria — interesse no segmento',
          visual_tone: 'Dinâmico, colorido, chamativo — foca na atenção',
        },
        {
          phase: 'Meio do Funil',
          formats: ['Carrossel de benefícios', 'Vídeo de depoimento'],
          messages: ['Prova social com cases reais', 'Diferenciais competitivos'],
          ctas: ['Ver cases de sucesso', 'Fale com um especialista'],
          audience_cohort: 'Remarketing de engajamento — visitantes e interações',
          visual_tone: 'Profissional e confiável — transmite credibilidade',
        },
        {
          phase: 'Fundo do Funil',
          formats: ['Post de oferta direta', 'Vídeo de produto/serviço'],
          messages: ['Oferta clara com benefício imediato', 'Urgência e escassez quando aplicável'],
          ctas: ['Quero começar agora', 'Solicitar proposta'],
          audience_cohort: 'Remarketing quente — leads e visitantes frequentes',
          visual_tone: 'Objetivo e direto — foca no resultado e na ação',
        },
      ];

    case 'lead_funnel':
      return {
        stages: [
          {
            stage: 'Visitante',
            conversion_rate: '100%',
            actions: ['Chega via anúncio, SEO ou indicação', 'Visita landing page ou perfil social'],
            drop_off_reasons: ['Página pouco atrativa', 'Proposta de valor não clara'],
            optimization_tips: ['Headline impactante', 'Prova social visível acima da dobra'],
          },
          {
            stage: 'Lead Capturado',
            conversion_rate: '3-8% dos visitantes',
            actions: ['Preenche formulário', 'Baixa material rico', 'Solicita contato'],
            drop_off_reasons: ['Formulário longo', 'Oferta pouco atrativa'],
            optimization_tips: ['Reduzir campos do formulário', 'Oferecer algo de valor imediato'],
          },
          {
            stage: 'Lead Engajado',
            conversion_rate: '40-60% dos leads',
            actions: ['Abre emails de nutrição', 'Retorna ao site', 'Interage com conteúdo'],
            drop_off_reasons: ['Conteúdo irrelevante', 'Frequência inadequada'],
            optimization_tips: ['Segmentar por interesse', 'Personalizar comunicação'],
          },
          {
            stage: 'MQL',
            conversion_rate: '20-35% dos engajados',
            actions: ['Demonstra intenção de compra', 'Visita página de preços', 'Solicita informação'],
            drop_off_reasons: ['Abordagem precoce de vendas', 'Falta de conteúdo de comparação'],
            optimization_tips: ['Conteúdo de comparação e decisão', 'Case studies específicos'],
          },
          {
            stage: 'Oportunidade',
            conversion_rate: '60-70% dos MQLs',
            actions: ['Entra em contato com comercial', 'Assiste demonstração', 'Solicita proposta'],
            drop_off_reasons: ['Proposta não alinhada', 'Processo comercial lento'],
            optimization_tips: ['SLA de resposta rápido', 'Proposta personalizada'],
          },
          {
            stage: 'Cliente',
            conversion_rate: '25-40% das oportunidades',
            actions: ['Fecha negócio', 'Assina contrato', 'Realiza primeiro pagamento'],
            drop_off_reasons: ['Preço não compatível', 'Perda para concorrente'],
            optimization_tips: ['Programa de boas-vindas', 'Onboarding estruturado'],
          },
        ],
        total_journey: 'O visitante chega ao ecossistema digital da marca via anúncios pagos ou conteúdo orgânico, é convertido em lead por meio de uma oferta de valor, nutrido com conteúdo relevante até demonstrar intenção de compra, momento em que é qualificado como MQL e passado para o time comercial, que conduz o fechamento.',
      };

    case 'mql_funnel':
      return {
        qualification_criteria: [
          { criterion: 'Engajamento com e-mails', weight: 'Alto', signals: ['Abriu 3+ e-mails nos últimos 30 dias', 'Clicou em links de conteúdo'] },
          { criterion: 'Comportamento no site', weight: 'Alto', signals: ['Visitou página de preços', 'Passou mais de 3 minutos no site'] },
          { criterion: 'Perfil demográfico', weight: 'Médio', signals: ['Cargo decisor ou influenciador', 'Empresa no segmento-alvo'] },
          { criterion: 'Interesse em conteúdo avançado', weight: 'Médio', signals: ['Baixou material de decisão', 'Assistiu webinar completo'] },
          { criterion: 'Interação nas redes sociais', weight: 'Baixo', signals: ['Comentou em posts', 'Compartilhou conteúdo da marca'] },
        ],
        nurturing_touchpoints: [
          { touchpoint: 'E-mail de boas-vindas', timing: 'Imediato após captação', objective: 'Apresentar a marca e entregar o prometido', channel: 'E-mail' },
          { touchpoint: 'Sequência educativa', timing: 'Dias 2-7', objective: 'Educar sobre o problema e a solução', channel: 'E-mail' },
          { touchpoint: 'Retargeting com prova social', timing: 'Semana 2', objective: 'Construir confiança com cases reais', channel: 'Ads' },
          { touchpoint: 'Conteúdo de consideração', timing: 'Semana 3', objective: 'Ajudar na decisão de compra', channel: 'E-mail + Ads' },
          { touchpoint: 'Oferta ou consulta gratuita', timing: 'Semana 4', objective: 'Converter o lead em oportunidade', channel: 'E-mail + WhatsApp' },
        ],
        handoff_process: 'Quando o lead atinge pontuação mínima de qualificação (score 70+) ou demonstra comportamento de intenção de compra, é automaticamente notificado ao time comercial via CRM. O responsável comercial deve entrar em contato em até 2 horas úteis. O contexto de nutrição (conteúdos consumidos, páginas visitadas, tempo de relacionamento) deve ser enviado junto com o lead para personalizar a abordagem.',
      };

    case 'editorial_calendar':
      return {
        weekly_model: [
          { day: 'Segunda', content_type: 'Educacional', theme: 'Dica prática do segmento', cohort: 'Coorte principal', format: 'Carrossel', platform: 'Instagram', responsible: 'Social Media' },
          { day: 'Terça', content_type: 'Institucional', theme: 'Bastidores e equipe', cohort: 'Todos', format: 'Stories', platform: 'Instagram', responsible: 'Social Media' },
          { day: 'Quarta', content_type: 'Prova Social', theme: 'Depoimento ou case de cliente', cohort: 'Coorte principal', format: 'Reels', platform: 'Instagram', responsible: 'Social Media' },
          { day: 'Quinta', content_type: 'Educacional', theme: 'Conteúdo de valor sobre produto/serviço', cohort: 'Coorte secundária', format: 'Carrossel', platform: 'Instagram', responsible: 'Social Media' },
          { day: 'Sexta', content_type: 'Conversão', theme: 'Oferta ou chamada para ação', cohort: 'Todos', format: 'Post estático + Stories', platform: 'Instagram', responsible: 'Social Media' },
          { day: 'Sábado', content_type: 'Inspiração', theme: 'Conteúdo motivacional alinhado à marca', cohort: 'Todos', format: 'Post estático', platform: 'Instagram', responsible: 'Social Media' },
          { day: 'Domingo', content_type: 'Descanso', theme: 'Sem publicação programada', cohort: '-', format: '-', platform: '-', responsible: '-' },
        ],
        monthly_model: [
          { week: 1, focus_theme: 'Apresentação e autoridade', posts_count: 5, key_dates: ['Verificar datas comemorativas da semana'], campaign_alignment: 'Topo de funil — reconhecimento' },
          { week: 2, focus_theme: 'Educação e valor profundo', posts_count: 5, key_dates: ['Verificar datas comemorativas da semana'], campaign_alignment: 'Meio de funil — consideração' },
          { week: 3, focus_theme: 'Prova social e credibilidade', posts_count: 5, key_dates: ['Verificar datas comemorativas da semana'], campaign_alignment: 'Meio de funil — consideração' },
          { week: 4, focus_theme: 'Conversão e fechamento do mês', posts_count: 4, key_dates: ['Último dia do mês — push de conversão'], campaign_alignment: 'Fundo de funil — conversão' },
        ],
      };

    case 'copy_manual':
      return {
        voice_guidelines: 'A marca se comunica de forma direta, acolhedora e especialista. Fala com autoridade sem ser arrogante, com proximidade sem ser informal em excesso. O tom é o de um especialista amigo: alguém que entende profundamente o assunto e se importa genuinamente com o sucesso de quem está lendo.\n\nEvita jargões técnicos excessivos, preferindo linguagem clara e acessível. Quando usa termos técnicos, sempre explica de forma simples. Valoriza a concretude: dados, exemplos reais e resultados mensuráveis têm peso maior que promessas vagas.\n\nEm momentos de conversão, é direto e confiante sem ser agressivo. Cria urgência genuína baseada em valor real, não em pressão artificial.',
        headline_formulas: [
          '[Número] + [Benefício concreto] + [Prazo ou Simplicidade]',
          'Como [Resultado desejado] sem [Principal objeção]',
          'A verdade sobre [Mito comum do segmento]',
          '[Segmento da audiência]: Você está [Erro comum]?',
          'O que [Referência de sucesso] faz de diferente em [Área de resultado]',
          'Pare de [Ação ineficiente]. Comece a [Ação eficiente]',
          '[Pergunta que expõe o problema principal da audiência]',
        ],
        cta_patterns: [
          'Quero [resultado desejado] →',
          'Comece agora',
          'Solicitar proposta gratuita',
          'Falar com especialista',
          'Ver como funciona',
          'Baixar material grátis',
          'Agendar demonstração',
          'Descobrir mais',
        ],
        vocabulary: {
          use: ['resultado', 'transformação', 'estratégia', 'personalizado', 'mensuráel', 'consistente', 'especialista', 'parceiro', 'crescimento', 'eficiência', 'autêntico', 'concreto', 'prático'],
          avoid: ['barato', 'promoção imperdível', 'incrível', 'melhor do mercado', 'revolucionário', 'disruptivo', 'sinergia', 'paradigma', 'robusto', 'soluções inovadoras'],
        },
        copy_examples: [
          { type: 'social', context: 'Post educativo no Instagram', example: 'Você sabia que 70% das empresas que investem em redes sociais não têm uma estratégia de conteúdo definida?\n\nO resultado? Investimento sem retorno.\n\nNestes 5 slides, mostramos o que precisa mudar para transformar seu marketing digital em resultados reais.\n\n↓ Deslize para ver' },
          { type: 'ads', context: 'Anúncio de awareness', example: 'Seu concorrente já está crescendo no digital. Enquanto você lê isso, ele está captando clientes que poderiam ser seus.\n\nConheça a estratégia que usamos para gerar resultados previsíveis para negócios como o seu.' },
          { type: 'email', context: 'E-mail de nutrição', example: 'Assunto: O erro que está custando leads para você\n\nOlá [Nome],\n\nDe cada 10 empresas que chegam até nós, 8 cometem o mesmo erro: investem em tráfego sem ter uma estratégia de conversão.\n\nÉ como contratar vendedores antes de ter um produto bem definido.\n\nNeste e-mail, vou te mostrar como corrigir isso em 3 passos simples...' },
          { type: 'landing_page', context: 'Headline de landing page', example: 'Transforme seu marketing digital em crescimento previsível — sem precisar de uma equipe interna grande ou anos de tentativa e erro.' },
        ],
      };

    case 'storytelling_storydoing':
      return {
        brand_narrative: 'Toda marca nasce de uma insatisfação com o que existe. A nossa não é diferente. Vimos negócios bons — com produtos excelentes, equipes dedicadas, clientes satisfeitos — lutando para crescer por não saberem como comunicar seu valor para o mundo digital.\n\nDecidimos mudar isso. Não com fórmulas prontas ou templates genéricos, mas com estratégia personalizada e parceria genuína. Acreditamos que cada negócio tem uma história única que merece ser contada de forma única.\n\nHoje, nossa missão é clara: ser o parceiro estratégico que ajuda bons negócios a serem vistos, escolhidos e admirados pelas pessoas certas.',
        story_arc: {
          hero: 'O empreendedor ou gestor que sabe que tem algo de valor a oferecer, mas não consegue comunicar isso efetivamente no mundo digital',
          conflict: 'O mercado digital é barulhento e competitivo. Sem estratégia, o bom produto ou serviço se perde no ruído. O herói investe tempo e dinheiro sem ver retorno consistente, enquanto concorrentes parecem crescer sem esforço',
          resolution: 'Com a estratégia certa, o herói passa a ser visto pelas pessoas certas, constrói autoridade genuína, atrai clientes alinhados com seu negócio e experimenta crescimento previsível — sem precisar virar refém do digital',
        },
        key_stories: [
          {
            title: 'A virada do invisível para o referência',
            narrative: 'Era um negócio que todo mundo que conhecia adorava, mas que poucos conheciam. Os clientes chegavam por indicação, o que era ótimo — mas limitado. Quando começamos a construir a presença digital deles, a história que já existia começou a alcançar quem precisava ouvir. Em 90 dias, o negócio tinha mais reconhecimento online do que em 5 anos de operação.',
            content_format: 'Carrossel de before/after em resultados + Reels de depoimento do cliente',
          },
          {
            title: 'Quando parar de tentar de tudo faz a diferença',
            narrative: 'Estavam tentando estar em todo lugar ao mesmo tempo: Instagram, TikTok, LinkedIn, YouTube, e-mail, WhatsApp... sem foco, sem consistência, sem resultado. Quando ajudamos a definir onde de fato a audiência deles estava e o que realmente funcionava para o negócio deles, os resultados vieram — com menos esforço.',
            content_format: 'Post de texto longo + Stories com enquete',
          },
        ],
        storydoing_actions: [
          { action: 'Publicar um case completo de cliente com antes/depois de métricas reais', objective: 'Construir credibilidade e prova social concreta', content_opportunity: 'Série de posts, Reels de depoimento e artigo no blog' },
          { action: 'Criar um conteúdo gratuito de alto valor (guia, template ou planilha)', objective: 'Captar leads qualificados e demonstrar expertise', content_opportunity: 'Landing page + E-mail marketing + Posts de divulgação' },
          { action: 'Mostrar o processo de trabalho em tempo real', objective: 'Humanizar a marca e diferenciar pelo método', content_opportunity: 'Stories de bastidores + Reels de processo' },
          { action: 'Realizar um diagnóstico gratuito ao vivo ou webinar', objective: 'Gerar leads qualificados e demonstrar autoridade na prática', content_opportunity: 'Live, posts de divulgação e e-mail de follow-up' },
        ],
      };

    case 'graphic_approach':
      return {
        visual_personality: 'A identidade visual da marca deve transmitir profissionalismo sem frieza, modernidade sem superficialidade. O equilíbrio entre elementos sóbrios e acolhedores cria uma sensação de confiança desde o primeiro contato visual.\n\nA linguagem gráfica prioriza clareza e legibilidade — o conteúdo nunca deve ser sacrificado por estética. Ao mesmo tempo, cada peça deve ter personalidade e ser reconhecível dentro do ecossistema da marca.\n\nO uso consistente de elementos visuais de identidade (cor, tipografia, espaçamentos) cria o reconhecimento que transforma visualizações em memória de marca.',
        color_guidelines: 'Paleta primária: azul profissional (confiança, autoridade) + branco (clareza, espaço). Paleta secundária: dourado ou verde-menta (destaque, crescimento) para elementos de ação e chamadas. Paleta de apoio: tons de cinza (estrutura, texto secundário). Regra geral: fundo claro com texto escuro para leitura — nunca inverter sem motivo estratégico.',
        typography_suggestions: 'Headline: sans-serif bold e moderno (ex: Inter Bold, Poppins Bold) — transmite força e clareza. Body/texto: sans-serif regular legível (ex: Inter Regular, DM Sans) — prioriza leitura em telas. Destaque/acento: pode usar peso semibold ou itálico do mesmo tipo para variação sem inconsistência.',
        mood_board_references: [
          'Notion — clareza, espaço em branco, tipografia clean',
          'Stripe — profissionalismo técnico com elegância moderna',
          'HubSpot — energia, cor laranja como destaque, estrutura organizada',
          'LinkedIn — tom corporativo acessível, azul como âncora visual',
        ],
        dos: [
          'Usar imagens reais do negócio sempre que possível',
          'Manter consistência de paleta em todos os formatos',
          'Ter sempre um elemento hierárquico claro (o que a pessoa deve ler primeiro)',
          'Deixar espaço em branco suficiente para respirar',
          'Usar no máximo 2 pesos tipográficos por peça',
          'Aplicar o logo sempre com versão de alto contraste para legibilidade',
        ],
        donts: [
          'Usar mais de 3 fontes diferentes na mesma peça',
          'Misturar estilos visuais conflitantes (ex: flat + ilustrativo + foto)',
          'Criar peças com poluição visual excessiva de texto',
          'Usar cores saturadas demais em fundo + texto simultaneamente',
          'Esticar ou distorcer o logo em qualquer hipótese',
          'Publicar imagens com baixa resolução ou pixeladas',
        ],
        style_per_type: [
          { content_type: 'Feed Instagram — Post estático', style: 'Layout clean com área dedicada para texto e imagem. Hierarquia visual clara. Marca discreta mas presente.', color_emphasis: 'Primária', typography_emphasis: 'Headline bold + body regular' },
          { content_type: 'Feed Instagram — Carrossel', style: 'Capa com gancho visual forte. Slides internos com consistência visual e progressão de informação. Último slide com CTA claro.', color_emphasis: 'Primária + destaque em pontos-chave', typography_emphasis: 'Numeração de slides + headline de capa em destaque' },
          { content_type: 'Reels (thumbnail)', style: 'Imagem ou frame inicial impactante. Texto sobreposto conciso (máx. 6 palavras). Alto contraste para legibilidade no autoplay.', color_emphasis: 'Alto contraste — primária ou fundo escuro', typography_emphasis: 'Bold grande, máx. 2 linhas' },
          { content_type: 'Stories', style: 'Formato vertical explorado ao máximo. Elementos interativos (enquete, link) integrados ao design. Movimento ou elemento de atenção nos primeiros 0.5s.', color_emphasis: 'Vibrante ou foto de impacto', typography_emphasis: 'Texto menor, legível em tela pequena' },
          { content_type: 'Anúncio — Banner', style: 'Proposta de valor imediata na parte superior. CTA visível sem rolar. Minimal mas impactante.', color_emphasis: 'Contraste alto — fundo da paleta primária', typography_emphasis: 'Headline grande + CTA em destaque colorido' },
        ],
      };
  }
}

/**
 * Generate a single strategic system via AI, with mock fallback.
 */
export async function generateStrategicSystem(
  context: PromptContext,
  type: StrategicSystemType,
  cohorts?: CohortData[]
): Promise<unknown> {
  if (!openaiClient.client) {
    logger.warn(`OpenAI not configured — returning mock data for strategic system: ${type}`);
    return getMockStrategicSystem(type);
  }

  const { systemPrompt, userPrompt } = buildPromptForType(type, context, cohorts);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openaiClient.client!.chat.completions.create({
        model: OPENAI_MODELS.GPT4O,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as unknown;
      logger.info(`Generated strategic system '${type}' for client '${context.clientName}'`);
      return parsed;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`generateStrategicSystem(${type}) attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  logger.error(`generateStrategicSystem(${type}) failed after retries — returning mock data`);
  return getMockStrategicSystem(type);
}

// ── Phase 7: Briefing generation ──────────────────────────────────────────────

import {
  BRIEFING_SYSTEM_PROMPTS,
  DESIGNER_BRIEFING_PROMPT,
  TRAFFIC_BRIEFING_PROMPT,
  ACCOUNT_BRIEFING_PROMPT,
  SITE_BRIEFING_PROMPT,
  buildBriefingUserPrompt,
} from './prompts/briefing.prompt';
import { BriefingType } from '../../types/index';

const MOCK_DESIGNER_BRIEFING = {
  title: 'Briefing de Design — Campanha de Conversão',
  scope_type: 'campanha',
  objective: 'Criar peças visuais para campanha de geração de leads com foco em conversão',
  target_cohort: 'Empreendedores locais que buscam crescer no digital',
  visual_references: [
    'Estética clean e profissional, similar ao estilo da Nubank',
    'Uso de imagens autênticas, evitar stock photos genéricas',
  ],
  deliverables: [
    { item: 'Post feed', format: 'JPG/PNG', dimensions: '1080x1080', quantity: 4 },
    { item: 'Story', format: 'JPG/PNG', dimensions: '1080x1920', quantity: 3 },
    { item: 'Banner anúncio', format: 'JPG', dimensions: '1200x628', quantity: 2 },
  ],
  tone_and_style: 'Moderno, confiável, com destaque para resultados mensuráveis',
  copy_references: ['Resultados reais, sem enrolação', 'Seu negócio merece crescer no digital'],
  deadline_suggestion: '5 dias úteis',
  additional_notes: 'Manter a paleta de cores da identidade visual do cliente',
};

const MOCK_TRAFFIC_BRIEFING = {
  title: 'Campanha de Geração de Leads — Meta Ads',
  objective: 'leads',
  budget_suggestion: 'R$ 1.500 - R$ 3.000/mês',
  audience_segments: [
    {
      name: 'Empreendedores Locais',
      cohort_reference: 'O empreendedor local que quer crescer no digital',
      targeting_criteria: 'Interesses em marketing digital, pequenas empresas, 35-50 anos',
    },
  ],
  funnel_stages: [
    {
      stage: 'Topo',
      message: 'Você sabia que 80% dos clientes pesquisam online antes de comprar?',
      creative_specs: 'Vídeo 15s ou carrossel educativo',
      cta: 'Saiba Mais',
    },
    {
      stage: 'Meio',
      message: 'Veja como outros negócios locais dobraram seus clientes digitais',
      creative_specs: 'Vídeo de prova social',
      cta: 'Ver Cases',
    },
    {
      stage: 'Fundo',
      message: 'Fale com um especialista — diagnóstico gratuito do seu negócio',
      creative_specs: 'Post de oferta direta',
      cta: 'Agendar Conversa',
    },
  ],
  platforms: ['Meta Ads'],
  copy_variants: [
    {
      stage: 'Topo',
      headline: 'Seu negócio está perdendo clientes para quem está no digital',
      body: 'Descubra como atrair clientes pelo Instagram e Google sem complicação.',
      cta: 'Saiba Mais',
    },
  ],
  success_metrics: [
    { metric: 'CPL (Custo por Lead)', target: 'Abaixo de R$ 30' },
    { metric: 'Taxa de conversão do formulário', target: 'Acima de 2%' },
  ],
  additional_notes: 'Testar criativos com imagens reais vs. ilustrações nos primeiros 14 dias',
};

const MOCK_ACCOUNT_BRIEFING = {
  title: 'Briefing de Conta — Próximos 30 Dias',
  period: 'Próximos 30 dias',
  client_status: 'Ativo e engajado, aguardando entregas do mês',
  priorities: [
    { item: 'Entregar calendário editorial aprovado', urgency: 'high' },
    { item: 'Alinhar criativo da campanha com cliente', urgency: 'high' },
    { item: 'Revisar relatório de performance do mês anterior', urgency: 'medium' },
  ],
  pending_decisions: [
    'Definir orçamento de impulsionamento para o próximo mês',
    'Aprovar identidade visual da campanha',
  ],
  checkin_prep: [
    'Quais foram os principais resultados esperados para este mês?',
    'Existem novidades ou promoções previstas para os próximos 30 dias?',
    'Há algum feedback sobre o conteúdo publicado recentemente?',
  ],
  team_coordination: [
    { team_member_role: 'Designer', action_needed: 'Aguardar aprovação do briefing de peças' },
    { team_member_role: 'Gestor de Tráfego', action_needed: 'Preparar estrutura da campanha assim que criativos forem aprovados' },
  ],
  risks_and_opportunities:
    'Oportunidade de campanha sazonal no próximo mês. Risco: atraso na aprovação do cliente pode comprometer o lançamento.',
  additional_notes: 'Cliente prefere comunicação por WhatsApp para aprovações rápidas',
};

function getMockBriefing(type: BriefingType): unknown {
  switch (type) {
    case 'designer': return MOCK_DESIGNER_BRIEFING;
    case 'traffic': return MOCK_TRAFFIC_BRIEFING;
    case 'account': return MOCK_ACCOUNT_BRIEFING;
    case 'site': return {
      title: 'Briefing de Site Institucional',
      objective: 'Criar landing page de captação de leads',
      target_audience: 'Empreendedores locais buscando agência digital',
      structure: [{ section: 'Hero', content_needed: 'Headline + CTA', notes: 'Destaque o principal benefício' }],
      seo_keywords: ['agência marketing digital', 'marketing local'],
      design_references: ['Clean e moderno, foco em conversão'],
      technical_requirements: ['Formulário de leads integrado ao CRM', 'Pixel Meta instalado'],
      copy_outline: 'Hero > Benefícios > Cases > Formulário de contato',
      deadline_suggestion: '15 dias úteis',
      additional_notes: 'Priorizar mobile-first',
    };
    default: return MOCK_DESIGNER_BRIEFING;
  }
}

function getBriefingSystemPrompt(type: BriefingType): string {
  switch (type) {
    case 'designer': return DESIGNER_BRIEFING_PROMPT;
    case 'traffic': return TRAFFIC_BRIEFING_PROMPT;
    case 'account': return ACCOUNT_BRIEFING_PROMPT;
    case 'site': return SITE_BRIEFING_PROMPT;
    default: return BRIEFING_SYSTEM_PROMPTS[type] ?? DESIGNER_BRIEFING_PROMPT;
  }
}

/**
 * Generate a role-specific briefing using AI.
 * Falls back to mock data when OpenAI is not configured.
 */
export async function generateBriefing(
  context: PromptContext,
  type: BriefingType,
  designerScope?: string
): Promise<unknown> {
  if (!openaiClient.client) {
    logger.warn(`OpenAI not configured — returning mock ${type} briefing`);
    return getMockBriefing(type);
  }

  const contextText = assembleContext(context);
  const systemPrompt = getBriefingSystemPrompt(type);
  const userPrompt = buildBriefingUserPrompt(
    type,
    contextText,
    context.sprintData?.length
      ? JSON.stringify(context.sprintData, null, 2)
      : undefined,
    context.whatsappMessages?.length
      ? context.whatsappMessages.join('\n')
      : undefined,
    designerScope
  );

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openaiClient.client!.chat.completions.create({
        model: OPENAI_MODELS.GPT4O,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as unknown;
      logger.info(`Generated ${type} briefing for client '${context.clientName}'`);
      return parsed;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`generateBriefing(${type}) attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  logger.error(`generateBriefing(${type}) failed after retries — returning mock data`);
  return getMockBriefing(type);
}

// ── Phase 9: BI generation ────────────────────────────────────────────────────

import { BI_PROMPT, buildBIUserPrompt } from './prompts/bi.prompt';

export interface KPIPerformance {
  kpi: string;
  target: string;
  actual: string;
  status: 'on_track' | 'behind' | 'achieved';
  trend: 'up' | 'down' | 'stable';
}

export interface BIRecommendation {
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  rationale: string;
}

export interface BIData {
  kpi_performance: KPIPerformance[];
  campaign_insights: string;
  content_performance_notes: string;
  recommendations: BIRecommendation[];
  risk_flags: string[];
  period_summary: string;
}

const MOCK_BI_DATA: BIData = {
  kpi_performance: [
    { kpi: 'ROI', target: '200%', actual: '185%', status: 'behind', trend: 'up' },
    { kpi: 'ROAS', target: '4.0', actual: '4.2', status: 'achieved', trend: 'up' },
    { kpi: 'CPA', target: 'R$50', actual: 'R$58', status: 'behind', trend: 'down' },
    { kpi: 'CTR', target: '2.5%', actual: '2.8%', status: 'achieved', trend: 'stable' },
  ],
  campaign_insights: 'As campanhas estão apresentando performance sólida no geral. O ROAS está acima da meta e o CTR demonstra boa qualidade dos criativos. O CPA e o ROI precisam de ajustes nas segmentações e lances.',
  content_performance_notes: 'Criativos em formato carrossel apresentam CTR 40% acima da média. Vídeos curtos têm alta taxa de visualização completa. Posts educativos geram mais salvamentos.',
  recommendations: [
    { priority: 'high', recommendation: 'Otimizar lances de CPA para reduzir custo por aquisição', rationale: 'CPA 16% acima da meta impacta o ROI geral da campanha' },
    { priority: 'medium', recommendation: 'Aumentar orçamento para campanhas com maior ROAS', rationale: 'Campanhas de remarketing apresentam ROAS 5.8, muito acima da meta' },
    { priority: 'low', recommendation: 'Testar novas segmentações de interesse', rationale: 'Expandir alcance para públicos similares pode reduzir CPA a longo prazo' },
  ],
  risk_flags: [
    'Saturação de audiência detectada em campanhas de awareness (frequência > 4.5)',
    'CPA acima da meta pode comprometer o ROI se não corrigido nas próximas 2 semanas',
  ],
  period_summary: 'Período com resultados mistos: ROAS e CTR acima das metas, enquanto ROI e CPA necessitam de otimização. Tendência geral positiva.',
};

export async function generateBI(
  context: PromptContext,
  biType: 'individual' | 'global' = 'individual'
): Promise<BIData> {
  if (!openaiClient.client) {
    logger.warn('generateBI: OpenAI not configured — returning mock BI data');
    return MOCK_BI_DATA;
  }

  const contextText = assembleContext(context);
  const userPrompt = buildBIUserPrompt(contextText, biType);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await openaiClient.client!.chat.completions.create({
        model: OPENAI_MODELS.GPT4O,
        messages: [
          { role: 'system', content: BI_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as BIData;
      logger.info(`generateBI(${biType}): success for client '${context.clientName}'`);
      return parsed;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`generateBI attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  logger.error('generateBI failed after retries — returning mock data');
  return MOCK_BI_DATA;
}

// ── Transcript Extraction (Handoff Step 1 → Step 2) ─────────────────────────

export interface StakeholderExtraction {
  name: string;
  role: 'decisor' | 'influenciador';
}

export interface TranscriptExtraction {
  companyName: string;
  razaoSocial: string;
  stakeholders: StakeholderExtraction[];
  projectStartDate: string;
  projectScope: string[];
}

const MOCK_EXTRACTION: TranscriptExtraction = {
  companyName: '',
  razaoSocial: '',
  stakeholders: [{ name: '', role: 'decisor' }],
  projectStartDate: '',
  projectScope: [],
};

export async function extractProjectFromTranscript(
  transcript: string,
): Promise<TranscriptExtraction> {
  if (!openaiClient.client) {
    logger.warn('extractProjectFromTranscript: OpenAI not configured — returning empty');
    return MOCK_EXTRACTION;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await openaiClient.client!.chat.completions.create({
        model: OPENAI_MODELS.GPT4O_MINI,
        messages: [
          { role: 'system', content: TRANSCRIPT_EXTRACTION_PROMPT },
          { role: 'user', content: transcript.slice(0, 12000) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as TranscriptExtraction;

      // Ensure stakeholders is never empty array and has correct shape
      if (!parsed.stakeholders || parsed.stakeholders.length === 0) {
        parsed.stakeholders = [{ name: '', role: 'decisor' }];
      } else {
        // Normalize: if AI returned strings instead of objects, convert
        parsed.stakeholders = parsed.stakeholders.map((s: unknown) => {
          if (typeof s === 'string') return { name: s, role: 'decisor' as const };
          const obj = s as StakeholderExtraction;
          return { name: obj.name || '', role: obj.role === 'influenciador' ? 'influenciador' : 'decisor' };
        });
      }

      logger.info('extractProjectFromTranscript: success');
      return parsed;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`extractProjectFromTranscript attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  logger.error('extractProjectFromTranscript failed after retries');
  return MOCK_EXTRACTION;
}
