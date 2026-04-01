import { Router } from 'express';
import {
  listCohorts,
  generateCohortsHandler,
  updateCohort,
  getEmpathyMap,
  generateEmpathyMapHandler,
  getCohortById,
  createCohort,
  deleteCohort,
} from '../controllers/cohorts.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// GET /api/cohorts/:clientId — list all cohorts for a client (scope-gated)
router.get('/:clientId', listCohorts);

// POST /api/cohorts/:clientId/generate — AI generate cohorts + empathy maps
router.post('/:clientId/generate', authorize('super_admin', 'coordenador', 'account'), generateCohortsHandler);

// PATCH /api/cohorts/:clientId/:cohortId — edit a single cohort field
router.patch('/:clientId/:cohortId', authorize('super_admin', 'coordenador', 'account'), updateCohort);

// GET /api/cohorts/:clientId/:cohortId/empathy-map — get empathy map for a cohort
router.get('/:clientId/:cohortId/empathy-map', getEmpathyMap);

// POST /api/cohorts/:clientId/:cohortId/empathy-map/generate — generate empathy map for a cohort
router.post(
  '/:clientId/:cohortId/empathy-map/generate',
  authorize('super_admin', 'coordenador', 'account'),
  generateEmpathyMapHandler
);

// Legacy routes (kept for backward compat)
router.post('/', authorize('super_admin', 'coordenador', 'account'), createCohort);
router.get('/by-id/:id', getCohortById);
router.delete('/:clientId/:cohortId', authorize('super_admin', 'coordenador', 'account'), deleteCohort);

export default router;
