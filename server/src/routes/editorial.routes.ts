import { Router } from 'express';
import * as editorialController from '../controllers/editorial.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// GET /api/editorial?clientId=xxx
router.get('/', editorialController.listEditorialLines);

// POST /api/editorial/generate
router.post('/generate', authorize('super_admin', 'coordenador', 'account'), editorialController.generateEditorial);

// POST /api/editorial
router.post('/', authorize('super_admin', 'coordenador', 'account'), editorialController.createEditorialLine);

// GET /api/editorial/:id
router.get('/:id', editorialController.getEditorialById);

// PATCH /api/editorial/:id
router.patch('/:id', authorize('super_admin', 'coordenador', 'account'), editorialController.updateEditorialLine);

export default router;
