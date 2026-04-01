import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createReportSchema } from '../schemas/reports.schema';

const router = Router();

router.use(authenticate);

// GET  /api/reports/:clientId — list reports (all authenticated roles)
router.get('/:clientId', reportsController.listReports);

// POST /api/reports/:clientId — create report (GT + admin only)
router.post(
  '/:clientId',
  authorize('super_admin', 'coordenador', 'gestor_trafego'),
  validate(createReportSchema),
  reportsController.createReport
);

// GET  /api/reports/:clientId/:reportId — single report
router.get('/:clientId/:reportId', reportsController.getReportById);

export default router;
