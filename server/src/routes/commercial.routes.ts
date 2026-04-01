import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeModule } from '../middleware/authorizeModule';
import { validate } from '../middleware/validate';
import {
  createGoalSchema, updateGoalSchema,
  createMonetizationSchema, updateMonetizationSchema,
  calculateCommissionsSchema, approveCommissionSchema,
  updateCommissionRuleSchema,
} from '../schemas/commercial.schema';
import * as controller from '../controllers/commercial.controller';

const router = Router();

// All commercial routes require authentication and the 'commercial' module
router.use(authenticate);
router.use(authorizeModule('commercial'));

// ─── Accounts (users with role 'account') ────────────────────────────────────
router.get('/accounts', controller.listAccounts);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', controller.getDashboard);

// ─── Goals ────────────────────────────────────────────────────────────────────
router.get('/goals', controller.listGoals);
router.post('/goals', validate(createGoalSchema), controller.createGoal);
router.get('/goals/:id', controller.getGoal);
router.get('/goals/:id/progress', controller.getGoalProgress);
router.patch('/goals/:id', validate(updateGoalSchema), controller.updateGoal);
router.delete('/goals/:id', controller.deleteGoal);

// ─── Commission Rules ──────────────────────────────────────────────────────────
router.get('/commission-rules', controller.listCommissionRules);
router.patch('/commission-rules/:id', validate(updateCommissionRuleSchema), controller.updateCommissionRule);

// ─── Monetizations ────────────────────────────────────────────────────────────
router.get('/monetizations/overview', controller.getMonetizationOverview);
router.get('/monetizations', controller.listMonetizations);
router.post('/monetizations', validate(createMonetizationSchema), controller.createMonetization);
router.get('/monetizations/:id', controller.getMonetization);
router.patch('/monetizations/:id', validate(updateMonetizationSchema), controller.updateMonetization);

// ─── Commissions ──────────────────────────────────────────────────────────────
router.get('/commissions/summary', controller.getCommissionSummary);
router.get('/commissions', controller.listCommissions);
router.post('/commissions/calculate', validate(calculateCommissionsSchema), controller.calculateCommissions);
router.patch('/commissions/:id/approve', validate(approveCommissionSchema), controller.approveCommission);

export default router;
