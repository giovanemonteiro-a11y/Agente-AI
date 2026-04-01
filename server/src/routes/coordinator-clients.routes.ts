import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  listCoordinatorClients,
  createBaseClient,
  churnClient,
  startTratativa,
  saveClient,
  updateCoordinatorClient,
  getCoordinatorDashboard,
} from '../controllers/coordinator-clients.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('coordenador', 'super_admin'));

router.get('/dashboard', getCoordinatorDashboard);
router.get('/', listCoordinatorClients);
router.post('/', createBaseClient);
router.patch('/:id/churn', churnClient);
router.patch('/:id/tratativa', startTratativa);
router.patch('/:id/save', saveClient);
router.patch('/:id', updateCoordinatorClient);

export default router;
