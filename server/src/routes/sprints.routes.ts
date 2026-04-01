import { Router } from 'express';
import * as sprintsController from '../controllers/sprints.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// GET /api/sprints?clientId=xxx
router.get('/', sprintsController.listSprintData);

// POST /api/sprints/sync — trigger manual sync
router.post('/sync', authorize('super_admin', 'coordenador', 'account'), sprintsController.syncSprintData);

// GET /api/sprints/:id
router.get('/:id', sprintsController.getSprintDataById);

export default router;
