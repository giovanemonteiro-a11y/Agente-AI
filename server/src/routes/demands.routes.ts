import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  listDemands,
  listPendingDemands,
  updateDemandStatus,
  dismissDemand,
} from '../controllers/demands.controller';

const router = Router();

router.use(authenticate);

router.get('/:clientId', listDemands);
router.get('/:clientId/pending', listPendingDemands);
router.patch('/:demandId/status', updateDemandStatus);
router.post('/:demandId/dismiss', dismissDemand);

export default router;
