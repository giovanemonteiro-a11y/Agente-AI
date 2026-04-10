import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getClientDashboard,
  calculateHealth,
  getClientHealthTrend,
  getPortfolioDashboard,
  generatePortfolio,
  calculateAllHealth,
  getHealthDistribution,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);

// Client-level
router.get('/client/:clientId', getClientDashboard);
router.post('/client/:clientId/calculate-health', calculateHealth);
router.get('/client/:clientId/health-trend', getClientHealthTrend);

// Portfolio-level
router.get('/portfolio', getPortfolioDashboard);
router.post('/portfolio/generate', generatePortfolio);
router.post('/calculate-all-health', calculateAllHealth);
router.get('/health/distribution', getHealthDistribution);

export default router;
