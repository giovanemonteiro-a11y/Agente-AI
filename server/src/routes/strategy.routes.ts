import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createStrategySchema, strategyHighlightSchema } from '../schemas/strategy.schema';
import {
  getLatestStrategy,
  getStrategyHistory,
  createStrategyVersion,
  getHighlights,
  streamHighlights,
  detectStrategyGaps,
} from '../controllers/strategy.controller';

const router = Router();

// All strategy routes require authentication
router.use(authenticate);

// ── Phase 3 routes (client-scoped) ───────────────────────────────────────────

// GET /api/strategy/:clientId — latest strategy version
router.get('/:clientId', getLatestStrategy);

// GET /api/strategy/:clientId/history — all versions (newest first)
router.get('/:clientId/history', getStrategyHistory);

// POST /api/strategy/:clientId — create new immutable version
router.post('/:clientId', authorize('super_admin', 'coordenador', 'account'), validate(createStrategySchema), createStrategyVersion);

// GET /api/strategy/:clientId/highlights/stream?field=objectives — SSE streaming
router.get('/:clientId/highlights/stream', streamHighlights);

// POST /api/strategy/:clientId/highlights — { fieldName } → top 3 excerpts
router.post('/:clientId/highlights', validate(strategyHighlightSchema), getHighlights);

// POST /api/strategy/:clientId/gaps — gap detection
router.post('/:clientId/gaps', detectStrategyGaps);

export default router;
