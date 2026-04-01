import { Router } from 'express';
import {
  listBriefings,
  generateBriefingHandler,
  getBriefingById,
  sendBriefing,
  pushBriefingToMonday,
  createBriefing,
  updateBriefing,
} from '../controllers/briefings.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { generateBriefingSchema, pushMondaySchema } from '../schemas/briefings.schema';

const router = Router();

router.use(authenticate);

// GET /api/briefings/:clientId — list briefings (role-filtered)
router.get('/:clientId', listBriefings);

// POST /api/briefings/:clientId/generate — AI-generate a briefing (account + admin only)
router.post('/:clientId/generate', authorize('super_admin', 'coordenador', 'account'), validate(generateBriefingSchema), generateBriefingHandler);

// GET /api/briefings/:clientId/:briefingId — single briefing
router.get('/:clientId/:briefingId', getBriefingById);

// POST /api/briefings/:clientId/:briefingId/send — mark sent, fire notification (account + admin)
router.post('/:clientId/:briefingId/send', authorize('super_admin', 'coordenador', 'account'), sendBriefing);

// POST /api/briefings/:clientId/:briefingId/push-monday — push to Monday.com (account + admin)
router.post(
  '/:clientId/:briefingId/push-monday',
  authorize('super_admin', 'coordenador', 'account'),
  validate(pushMondaySchema),
  pushBriefingToMonday
);

// Legacy routes (kept for backwards compat — return 410/405)
router.post('/:clientId', authorize('super_admin', 'coordenador', 'account'), createBriefing);
router.patch('/:clientId/:briefingId', authorize('super_admin', 'coordenador', 'account'), updateBriefing);

export default router;
