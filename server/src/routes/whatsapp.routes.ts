import { Router } from 'express';
import * as whatsappController from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// ── Public webhook endpoints (no auth — Meta calls these) ─────────────────────
// GET  /api/whatsapp/webhook — Meta verification challenge
router.get('/webhook', whatsappController.verifyWebhook);

// POST /api/whatsapp/webhook — incoming message from Meta
router.post('/webhook', whatsappController.receiveWebhook);

// ── Authenticated endpoints ───────────────────────────────────────────────────
router.use(authenticate);

// GET  /api/whatsapp/:clientId/messages — list messages
router.get('/:clientId/messages', whatsappController.listMessages);

// POST /api/whatsapp/:clientId/extract-demands — trigger demand extraction
router.post(
  '/:clientId/extract-demands',
  authorize('account', 'super_admin', 'coordenador'),
  whatsappController.extractDemands
);

export default router;
