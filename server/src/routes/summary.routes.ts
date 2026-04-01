import { Router } from 'express';
import {
  getSummaryByClient,
  generateSummary,
  updateSummary,
  approveSummary,
  getSummaryDiff,
} from '../controllers/summary.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// GET /api/summary/:clientId — role-gated inside controller
router.get('/:clientId', getSummaryByClient);

// POST /api/summary/:clientId/generate — account + admin only
router.post('/:clientId/generate', authorize('super_admin', 'coordenador', 'account'), generateSummary);

// PATCH /api/summary/:clientId — inline edit, account + admin only
router.patch('/:clientId', authorize('super_admin', 'coordenador', 'account'), updateSummary);

// POST /api/summary/:clientId/approve — account + admin only
router.post('/:clientId/approve', authorize('super_admin', 'coordenador', 'account'), approveSummary);

// GET /api/summary/:clientId/diff — show what changed after auto-refresh
router.get('/:clientId/diff', authorize('super_admin', 'coordenador', 'account'), getSummaryDiff);

export default router;
