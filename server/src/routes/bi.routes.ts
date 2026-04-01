import { Router } from 'express';
import * as biController from '../controllers/bi.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// GET  /api/bi/global — global BI (account + admin)
router.get(
  '/global',
  authorize('super_admin', 'coordenador', 'account'),
  biController.getGlobalBI
);

// POST /api/bi/global/generate — generate global BI (admin only)
router.post(
  '/global/generate',
  authorize('super_admin', 'coordenador'),
  biController.generateGlobalBI
);

// GET  /api/bi/:clientId — individual BI (all roles can view)
router.get('/:clientId', biController.getClientBI);

// POST /api/bi/:clientId/generate — generate individual BI (account + admin)
router.post(
  '/:clientId/generate',
  authorize('super_admin', 'coordenador', 'account'),
  biController.generateClientBI
);

export default router;
