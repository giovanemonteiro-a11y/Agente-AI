/**
 * Markdown templates for rendering knowledge documents as Obsidian-compatible .md files.
 * Each template produces markdown with YAML frontmatter and wikilinks.
 */

function frontmatter(meta: Record<string, unknown>): string {
  const lines = Object.entries(meta).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n\n`;
}

function wikilink(docType: string, label?: string): string {
  return label ? `[[${docType}|${label}]]` : `[[${docType}]]`;
}

export function renderOnePageSummary(data: Record<string, unknown>, clientName: string): string {
  const d = data as { overview?: string; objectives?: string[]; services?: string[]; stakeholders?: string[]; keyMetrics?: string[]; timeline?: string };
  return frontmatter({ type: 'one_page_summary', client: clientName, updated: new Date().toISOString() })
    + `# ${clientName} — One Page Summary\n\n`
    + `## Visao Geral\n${d.overview ?? 'N/A'}\n\n`
    + `## Objetivos\n${(d.objectives ?? []).map(o => `- ${o}`).join('\n')}\n\n`
    + `## Servicos Contratados\n${(d.services ?? []).map(s => `- ${s}`).join('\n')}\n\n`
    + `## Stakeholders\n${(d.stakeholders ?? []).map(s => `- ${s}`).join('\n')}\n\n`
    + `## Metricas Chave\n${(d.keyMetrics ?? []).map(m => `- ${m}`).join('\n')}\n\n`
    + `## Timeline\n${d.timeline ?? 'N/A'}\n\n`
    + `---\n**Docs relacionados:** ${wikilink('cohort-analysis', 'Cohorts')} | ${wikilink('business-canvas', 'Canvas')} | ${wikilink('strategy-digest', 'Estrategia')}\n`;
}

export function renderCohortAnalysis(data: Record<string, unknown>, clientName: string): string {
  const d = data as { cohorts?: Array<{ name: string; description: string; size?: string; channels?: string[] }> };
  let md = frontmatter({ type: 'cohort_analysis', client: clientName, updated: new Date().toISOString() })
    + `# ${clientName} — Analise de Cohorts\n\n`;

  (d.cohorts ?? []).forEach((c, i) => {
    md += `## Cohort ${i + 1}: ${c.name}\n`;
    md += `${c.description}\n`;
    if (c.size) md += `- **Tamanho estimado:** ${c.size}\n`;
    if (c.channels?.length) md += `- **Canais:** ${c.channels.join(', ')}\n`;
    md += '\n';
  });

  md += `---\n**Docs relacionados:** ${wikilink('empathy-map', 'Mapa de Empatia')} | ${wikilink('persona', 'Personas')}\n`;
  return md;
}

export function renderEmpathyMap(data: Record<string, unknown>, clientName: string): string {
  const d = data as { thinks?: string[]; feels?: string[]; says?: string[]; does?: string[]; pains?: string[]; gains?: string[] };
  return frontmatter({ type: 'empathy_map', client: clientName, updated: new Date().toISOString() })
    + `# ${clientName} — Mapa de Empatia\n\n`
    + `## O que Pensa\n${(d.thinks ?? []).map(t => `- ${t}`).join('\n')}\n\n`
    + `## O que Sente\n${(d.feels ?? []).map(f => `- ${f}`).join('\n')}\n\n`
    + `## O que Diz\n${(d.says ?? []).map(s => `- ${s}`).join('\n')}\n\n`
    + `## O que Faz\n${(d.does ?? []).map(d2 => `- ${d2}`).join('\n')}\n\n`
    + `## Dores\n${(d.pains ?? []).map(p => `- ${p}`).join('\n')}\n\n`
    + `## Ganhos\n${(d.gains ?? []).map(g => `- ${g}`).join('\n')}\n\n`;
}

export function renderBusinessCanvas(data: Record<string, unknown>, clientName: string): string {
  const d = data as Record<string, string[] | string>;
  const sections = [
    ['Proposta de Valor', 'valueProposition'],
    ['Segmentos de Clientes', 'customerSegments'],
    ['Canais', 'channels'],
    ['Relacionamento', 'customerRelationships'],
    ['Fontes de Receita', 'revenueStreams'],
    ['Recursos Chave', 'keyResources'],
    ['Atividades Chave', 'keyActivities'],
    ['Parceiros Chave', 'keyPartners'],
    ['Estrutura de Custos', 'costStructure'],
  ];

  let md = frontmatter({ type: 'business_canvas', client: clientName, updated: new Date().toISOString() })
    + `# ${clientName} — Business Model Canvas\n\n`;

  sections.forEach(([label, key]) => {
    const val = d[key];
    md += `## ${label}\n`;
    md += Array.isArray(val) ? val.map(v => `- ${v}`).join('\n') : (val ?? 'N/A');
    md += '\n\n';
  });

  return md;
}

export function renderPersona(data: Record<string, unknown>, clientName: string): string {
  const d = data as { personas?: Array<{ name: string; age?: string; occupation?: string; goals?: string[]; frustrations?: string[]; channels?: string[]; quote?: string }> };
  let md = frontmatter({ type: 'persona', client: clientName, updated: new Date().toISOString() })
    + `# ${clientName} — Personas\n\n`;

  (d.personas ?? []).forEach((p, i) => {
    md += `## Persona ${i + 1}: ${p.name}\n`;
    if (p.age) md += `- **Idade:** ${p.age}\n`;
    if (p.occupation) md += `- **Ocupacao:** ${p.occupation}\n`;
    if (p.quote) md += `> "${p.quote}"\n\n`;
    if (p.goals?.length) md += `### Objetivos\n${p.goals.map(g => `- ${g}`).join('\n')}\n\n`;
    if (p.frustrations?.length) md += `### Frustracoes\n${p.frustrations.map(f => `- ${f}`).join('\n')}\n\n`;
    if (p.channels?.length) md += `### Canais\n${p.channels.map(c => `- ${c}`).join('\n')}\n\n`;
  });

  return md;
}

export function renderCompetitiveScenario(data: Record<string, unknown>, clientName: string): string {
  const d = data as { competitors?: Array<{ name: string; strengths?: string[]; weaknesses?: string[] }>; opportunities?: string[]; threats?: string[]; positioning?: string };
  let md = frontmatter({ type: 'competitive_scenario', client: clientName, updated: new Date().toISOString() })
    + `# ${clientName} — Cenario Competitivo\n\n`
    + `## Posicionamento\n${d.positioning ?? 'N/A'}\n\n`
    + `## Concorrentes\n`;

  (d.competitors ?? []).forEach(c => {
    md += `### ${c.name}\n`;
    if (c.strengths?.length) md += `**Forcas:** ${c.strengths.join(', ')}\n`;
    if (c.weaknesses?.length) md += `**Fraquezas:** ${c.weaknesses.join(', ')}\n\n`;
  });

  md += `## Oportunidades\n${(d.opportunities ?? []).map(o => `- ${o}`).join('\n')}\n\n`;
  md += `## Ameacas\n${(d.threats ?? []).map(t => `- ${t}`).join('\n')}\n\n`;
  return md;
}

export function renderGenericDocument(data: Record<string, unknown>, clientName: string, docType: string, title: string): string {
  let md = frontmatter({ type: docType, client: clientName, updated: new Date().toISOString() })
    + `# ${clientName} — ${title}\n\n`;

  // Render all top-level keys as sections
  for (const [key, value] of Object.entries(data)) {
    const sectionTitle = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    md += `## ${sectionTitle}\n`;
    if (Array.isArray(value)) {
      md += value.map(v => typeof v === 'string' ? `- ${v}` : `- ${JSON.stringify(v)}`).join('\n');
    } else if (typeof value === 'object' && value !== null) {
      md += '```json\n' + JSON.stringify(value, null, 2) + '\n```';
    } else {
      md += String(value ?? 'N/A');
    }
    md += '\n\n';
  }

  return md;
}

/** Main dispatcher: render any doc type to markdown */
export function renderToMarkdown(docType: string, data: Record<string, unknown>, clientName: string): string {
  switch (docType) {
    case 'one_page_summary': return renderOnePageSummary(data, clientName);
    case 'cohort_analysis': return renderCohortAnalysis(data, clientName);
    case 'empathy_map': return renderEmpathyMap(data, clientName);
    case 'business_canvas': return renderBusinessCanvas(data, clientName);
    case 'persona': return renderPersona(data, clientName);
    case 'competitive_scenario': return renderCompetitiveScenario(data, clientName);
    default: {
      const title = docType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return renderGenericDocument(data, clientName, docType, title);
    }
  }
}
