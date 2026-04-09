import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getStatus,
  connect,
  getGroups,
  evolutionWebhook,
} from '../controllers/evolution.controller';

const router = Router();

// Webhook endpoint — NO authentication (called by Evolution API server)
router.post('/webhooks/evolution', evolutionWebhook);

// Authenticated endpoints
router.get('/evolution/status', authenticate, getStatus);
router.post('/evolution/connect', authenticate, connect);
router.get('/evolution/groups', authenticate, getGroups);

export default router;
