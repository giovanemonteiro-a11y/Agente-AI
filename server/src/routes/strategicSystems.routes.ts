import { Router } from 'express';
import {
  listSystems,
  getSystem,
  generateSystem,
  updateSystem,
  generateAllSystems,
} from '../controllers/strategicSystems.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// GET /api/systems/:clientId — list all systems for a client with status
router.get('/:clientId', listSystems);

// GET /api/systems/:clientId/:type — get a single system by type
router.get('/:clientId/:type', getSystem);

// POST /api/systems/:clientId/:type/generate — generate a specific system
router.post('/:clientId/:type/generate', authorize('super_admin', 'coordenador', 'account'), generateSystem);

// PATCH /api/systems/:clientId/:type — update content_json of a system
router.patch('/:clientId/:type', authorize('super_admin', 'coordenador', 'account'), updateSystem);

// POST /api/systems/:clientId/generate-all — generate all applicable systems
router.post('/:clientId/generate-all', authorize('super_admin', 'coordenador', 'account'), generateAllSystems);

export default router;
