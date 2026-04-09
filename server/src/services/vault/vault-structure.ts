/**
 * Defines the canonical folder hierarchy for the SICI Vault (Obsidian brain).
 * Each client gets a folder structure that maps to Obsidian navigation.
 */

export const VAULT_FOLDERS = {
  FOUNDATION: '01-Foundation',
  AUDIENCE: '02-Audience',
  STRATEGY: '03-Strategy',
  PERFORMANCE: '04-Performance',
  OPERATIONS: '05-Operations',
  HYPOTHESES: '06-Hypotheses',
} as const;

export const PORTFOLIO_FOLDER = '_Portfolio';

/** Maps doc_type to vault folder and filename */
export const DOC_TYPE_MAP: Record<string, { folder: string; filename: string }> = {
  // Foundation
  one_page_summary: { folder: VAULT_FOLDERS.FOUNDATION, filename: 'one-page-summary.md' },
  strategy_digest: { folder: VAULT_FOLDERS.FOUNDATION, filename: 'strategy-digest.md' },
  handoff_digest: { folder: VAULT_FOLDERS.FOUNDATION, filename: 'handoff-digest.md' },
  kickoff_digest: { folder: VAULT_FOLDERS.FOUNDATION, filename: 'kickoff-digest.md' },
  checkin_digest: { folder: VAULT_FOLDERS.FOUNDATION, filename: 'checkin-digest.md' },

  // Audience
  cohort_analysis: { folder: VAULT_FOLDERS.AUDIENCE, filename: 'cohort-analysis.md' },
  empathy_map: { folder: VAULT_FOLDERS.AUDIENCE, filename: 'empathy-map.md' },
  persona: { folder: VAULT_FOLDERS.AUDIENCE, filename: 'persona.md' },
  archetype: { folder: VAULT_FOLDERS.AUDIENCE, filename: 'archetype.md' },

  // Strategy
  business_canvas: { folder: VAULT_FOLDERS.STRATEGY, filename: 'business-canvas.md' },
  copy_manual: { folder: VAULT_FOLDERS.STRATEGY, filename: 'copy-manual.md' },
  competitive_scenario: { folder: VAULT_FOLDERS.STRATEGY, filename: 'competitive-scenario.md' },
  market_analysis: { folder: VAULT_FOLDERS.STRATEGY, filename: 'market-analysis.md' },
  benchmarking: { folder: VAULT_FOLDERS.STRATEGY, filename: 'benchmarking.md' },

  // Performance
  traffic_report: { folder: VAULT_FOLDERS.PERFORMANCE, filename: 'traffic-report.md' },
  client_health: { folder: VAULT_FOLDERS.PERFORMANCE, filename: 'client-health.md' },

  // Operations
  meeting_digest: { folder: VAULT_FOLDERS.OPERATIONS, filename: 'meeting-digest.md' },
  whatsapp_digest: { folder: VAULT_FOLDERS.OPERATIONS, filename: 'whatsapp-digest.md' },

  // Hypotheses
  hypothesis_report: { folder: VAULT_FOLDERS.HYPOTHESES, filename: 'hypothesis-report.md' },

  // Portfolio (global)
  portfolio_bi: { folder: PORTFOLIO_FOLDER, filename: 'portfolio-bi.md' },
};

/**
 * Get the vault path for a document type within a client's vault.
 */
export function getVaultPath(clientName: string, docType: string): string {
  const mapping = DOC_TYPE_MAP[docType];
  if (!mapping) return `${clientName}/${docType}.md`;

  if (docType === 'portfolio_bi') {
    return `${PORTFOLIO_FOLDER}/${mapping.filename}`;
  }

  return `${clientName}/${mapping.folder}/${mapping.filename}`;
}

/**
 * Get all folder names needed for a client's vault structure.
 */
export function getClientVaultFolders(): string[] {
  return Object.values(VAULT_FOLDERS);
}
