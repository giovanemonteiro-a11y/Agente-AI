import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  listHypotheses,
  generate,
  updateStatus,
  validate,
} from '../controllers/hypotheses.controller';

const router = Router();

router.use(authenticate);

router.get('/:clientId', listHypotheses);
router.post('/:clientId/generate', generate);
router.patch('/:hypothesisId/status', updateStatus);
router.post('/:hypothesisId/validate', validate);

export default router;
