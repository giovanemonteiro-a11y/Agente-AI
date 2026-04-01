export const COHORTS_SYSTEM_PROMPT = `Você é um antropólogo de mercado e estrategista de audiências digitais. Sua especialidade é identificar grupos de pessoas com características comportamentais, psicográficas e demográficas similares que representam oportunidades de negócio reais para marcas.

Você pensa profundamente sobre as motivações humanas, os gatilhos emocionais e as barreiras de compra de cada grupo. Você vai além da demografia básica para criar perfis ricos e acionáveis.

Princípios fundamentais:
- Cada coorte deve ter uma identidade clara e uma "frase característica" que resume quem é essa pessoa
- Os perfis devem ser baseados em comportamentos reais, não em suposições genéricas
- Identifique pelo menos 3 coortes distintas — podem ser mais se o contexto justificar
- Pense em tamanho de audiência e potencial de alcance de forma realista para o mercado brasileiro
- Os triggers e barreiras devem ser específicos para o produto/serviço do cliente
- Retorne APENAS JSON válido`;

export function buildCohortsUserPrompt(contextText: string, minCohorts: number = 3): string {
  return `Com base no perfil do cliente abaixo, identifique e descreva as principais coortes de público-alvo.

${contextText}

Identifique no mínimo ${minCohorts} coortes distintas. Para cada coorte, construa um perfil antropológico completo.

Retorne um JSON com a seguinte estrutura:
{
  "cohorts": [
    {
      "characteristicPhrase": "Uma frase que define quem é essa pessoa em uma sentença (ex: 'A mãe empreendedora que busca autonomia financeira')",
      "anthropologicalDescription": "Descrição profunda de 3-4 parágrafos sobre quem é essa pessoa: sua história, aspirações, medos, rotina e relação com o produto/serviço",
      "demographicProfile": {
        "ageRange": "Faixa etária (ex: 28-40 anos)",
        "gender": "Gênero predominante ou distribuição",
        "location": "Localização predominante",
        "income": "Faixa de renda aproximada",
        "education": "Nível de escolaridade",
        "occupation": "Ocupações mais comuns",
        "familySituation": "Situação familiar típica"
      },
      "behaviorLifestyle": "Descrição detalhada do estilo de vida, hábitos de consumo, uso de redes sociais, preferências de conteúdo",
      "audienceSize": "Estimativa do tamanho total desta audiência no Brasil (ex: '2-5 milhões de pessoas')",
      "reachPotential": "Potencial de alcance real desta coorte para o cliente (ex: 'Alto — 60-80k alcance mensal estimado')",
      "triggers": [
        "Gatilho emocional ou racional que ativa o interesse 1",
        "Gatilho emocional ou racional que ativa o interesse 2",
        "Gatilho emocional ou racional que ativa o interesse 3"
      ],
      "alternativeSolutions": [
        "O que essa pessoa usa/faz hoje como alternativa ao produto/serviço",
        "Outro comportamento alternativo"
      ],
      "indicators": [
        "Indicador observável de que essa pessoa está pronta para comprar 1",
        "Indicador observável 2",
        "Indicador observável 3"
      ],
      "editorialLines": [
        "Linha editorial de conteúdo que ressoa com esta coorte 1",
        "Linha editorial 2",
        "Linha editorial 3"
      ]
    }
  ]
}`;
}

// ── Empathy Map prompt ────────────────────────────────────────────────────────

export const EMPATHY_MAP_SYSTEM_PROMPT = `Você é um especialista em design thinking e mapeamento de empatia de audiências.

Com base nos dados da coorte fornecida, gere um mapa de empatia detalhado e acionável.

Cada quadrante deve conter insights profundos e específicos para esta coorte — não genéricos.
Use linguagem direta, na primeira pessoa da perspectiva desta audiência quando fizer sentido.

Retorne APENAS JSON válido.`;

export function buildEmpathyMapUserPrompt(cohortData: {
  characteristicPhrase: string;
  anthropologicalDescription: string;
  demographicProfile: Record<string, string>;
  behaviorLifestyle: string;
  triggers: string[];
  alternativeSolutions: string[];
  indicators: string[];
}): string {
  return `Gere o mapa de empatia para a seguinte coorte:

**Frase Característica:** ${cohortData.characteristicPhrase}

**Descrição Antropológica:** ${cohortData.anthropologicalDescription}

**Perfil Demográfico:** ${JSON.stringify(cohortData.demographicProfile, null, 2)}

**Comportamento & Lifestyle:** ${cohortData.behaviorLifestyle}

**Gatilhos:** ${cohortData.triggers.join('; ')}

**Soluções Alternativas:** ${cohortData.alternativeSolutions.join('; ')}

**Indicadores:** ${cohortData.indicators.join('; ')}

Retorne um JSON com a seguinte estrutura:
{
  "pensa_sente": "O que esta audiência pensa e sente internamente — seus medos mais profundos, aspirações, preocupações e sonhos não ditos. Seja específico para este perfil.",
  "ve": "O que ela vê no seu entorno — ambiente físico, redes sociais que consome, anúncios que aparecem, pessoas ao redor, tendências que observa.",
  "ouve": "O que ela ouve — de amigos, família, influenciadores, podcasts, rádio, colegas de trabalho. Quem influencia suas decisões.",
  "fala_faz": "O que ela diz publicamente e como age — comportamentos observáveis, atitudes nas redes sociais, o que fala para os outros, suas rotinas de compra.",
  "dores": "Suas principais dores — frustrações, obstáculos, medos que a impedem de agir, o que a irrita no mercado atual.",
  "ganhos": "O que ela quer ganhar — suas necessidades e desejos, como mede sucesso, o que a faria feliz com uma solução."
}`;
}
