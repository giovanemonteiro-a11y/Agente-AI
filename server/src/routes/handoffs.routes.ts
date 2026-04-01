import { Router } from 'express';
import {
  createHandoff,
  extractTranscript,
  getHandoff,
  getMyHandoffs,
  getLeadershipHandoffs,
  getCoordinatorHandoffs,
  updateHandoffStep,
  generateSpiced,
  confirmAnalysis,
  sendToLeadership,
  approveHandoff,
  forwardToCoordinator,
  assignTrio,
} from '../controllers/handoffs.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// POST /api/handoffs/extract-transcript — AI extraction from transcript
router.post('/extract-transcript', authorize('aquisicao', 'super_admin'), extractTranscript);

// POST /api/handoffs — create a new draft handoff
router.post('/', authorize('aquisicao', 'super_admin'), createHandoff);

// GET /api/handoffs/my — list handoffs created by current user
router.get('/my', getMyHandoffs);

// GET /api/handoffs/leadership — list handoffs for leadership CRM
router.get('/leadership', authorize('lideranca', 'super_admin'), getLeadershipHandoffs);

// GET /api/handoffs/coordinator — list handoffs for coordinator
router.get('/coordinator', authorize('coordenador', 'super_admin'), getCoordinatorHandoffs);

// GET /api/handoffs/:id — get single handoff
router.get('/:id', getHandoff);

// PATCH /api/handoffs/:id/step/:step — update step data
router.patch('/:id/step/:step', authorize('aquisicao', 'super_admin'), updateHandoffStep);

// POST /api/handoffs/:id/generate-spiced — trigger SPICED AI analysis
router.post('/:id/generate-spiced', authorize('aquisicao', 'super_admin'), generateSpiced);

// PATCH /api/handoffs/:id/confirm-analysis — confirm analyst review
router.patch('/:id/confirm-analysis', authorize('aquisicao', 'super_admin'), confirmAnalysis);

// POST /api/handoffs/:id/send — send to leadership for approval
router.post('/:id/send', authorize('aquisicao', 'super_admin'), sendToLeadership);

// PATCH /api/handoffs/:id/approve — leadership approves handoff
router.patch('/:id/approve', authorize('lideranca', 'super_admin'), approveHandoff);

// POST /api/handoffs/:id/forward — forward to coordinator
router.post('/:id/forward', authorize('lideranca', 'super_admin'), forwardToCoordinator);

// POST /api/handoffs/:id/assign-trio — coordinator assigns trio
router.post('/:id/assign-trio', authorize('coordenador', 'super_admin'), assignTrio);

export default router;
