import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  findByClientId,
  findByClientAndType,
  upsert,
} from '../repositories/knowledge.repository';
import { renderVaultDocument } from '../services/vault/vault.service';
import { logger } from '../utils/logger';

// ── GET /api/knowledge/:clientId ────────────────────────────────────────────

export const listClientKnowledge = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const docs = await findByClientId(req.params.clientId);
  res.status(200).json({ data: docs });
});

// ── GET /api/knowledge/:clientId/:docType ───────────────────────────────────

export const getKnowledgeDoc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const doc = await findByClientAndType(req.params.clientId, req.params.docType);
  if (!doc) {
    throw new AppError('Knowledge document not found', 404);
  }
  res.status(200).json({ data: doc });
});

// ── POST /api/knowledge/:clientId/generate/:docType ─────────────────────────

export const generateKnowledgeDoc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId, docType } = req.params;

  logger.info(`Generating knowledge doc: ${docType} for client ${clientId}`);

  // For now, generate a placeholder — will be replaced by full knowledge-generator in Phase 1
  const clientName = (req.body.clientName as string) ?? 'Cliente';
  const placeholderData: Record<string, unknown> = {
    overview: `Documento ${docType} gerado automaticamente para ${clientName}.`,
    generatedAt: new Date().toISOString(),
    status: 'placeholder — Fase 1 implementara geracao completa via AI',
  };

  const { markdown, vaultPath } = renderVaultDocument({
    clientName,
    docType,
    data: placeholderData,
  });

  const saved = await upsert({
    client_id: clientId,
    doc_type: docType,
    title: `${docType.replace(/_/g, ' ')} — ${clientName}`,
    content_md: markdown,
    content_json: placeholderData,
    vault_path: vaultPath,
    generated_by: 'groq',
  });

  res.status(201).json({ data: saved });
});

// ── POST /api/knowledge/:clientId/sync ──────────────────────────────────────

export const syncClientVault = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const docs = await findByClientId(clientId);
  logger.info(`Syncing ${docs.length} docs to vault for client ${clientId}`);

  // TODO: Phase 0.6 — implement actual Drive sync via vault.service.ts
  res.status(200).json({
    message: `Vault sync queued for ${docs.length} documents`,
    documents: docs.map(d => ({ docType: d.doc_type, vaultPath: d.vault_path })),
  });
});
