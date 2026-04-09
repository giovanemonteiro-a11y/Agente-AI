import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  findByClientId,
  findByClientAndType,
} from '../repositories/knowledge.repository';
import {
  generateDocument,
  generateAllDocuments,
  GENERABLE_DOC_TYPES,
} from '../services/knowledge/knowledge-generator.service';
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

  if (!GENERABLE_DOC_TYPES.includes(docType)) {
    throw new AppError(`Invalid doc type: ${docType}. Valid types: ${GENERABLE_DOC_TYPES.join(', ')}`, 400);
  }

  logger.info(`Generating knowledge doc: ${docType} for client ${clientId}`);

  const result = await generateDocument(clientId, docType);

  const saved = await findByClientAndType(clientId, docType);
  res.status(201).json({ data: saved, generation: result });
});

// ── POST /api/knowledge/:clientId/generate-all ──────────────────────────────

export const generateAllKnowledgeDocs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  logger.info(`Generating ALL knowledge docs for client ${clientId}`);

  const results = await generateAllDocuments(clientId);

  const success = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;

  res.status(201).json({
    message: `Generated ${success}/${GENERABLE_DOC_TYPES.length} documents (${failed} failed)`,
    results,
  });
});

// ── POST /api/knowledge/:clientId/sync ──────────────────────────────────────

export const syncClientVault = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const docs = await findByClientId(clientId);
  logger.info(`Syncing ${docs.length} docs to vault for client ${clientId}`);

  // TODO: implement actual Drive sync via vault.service.ts
  res.status(200).json({
    message: `Vault sync queued for ${docs.length} documents`,
    documents: docs.map(d => ({ docType: d.doc_type, vaultPath: d.vault_path })),
  });
});
