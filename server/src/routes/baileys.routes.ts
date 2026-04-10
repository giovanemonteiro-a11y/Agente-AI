import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getConnectionStatus,
  startWhatsApp,
  getQRCode,
  disconnectWhatsApp,
  getGroups,
} from '../controllers/baileys.controller';

const router = Router();

// QR code page — no auth required (accessed via browser to scan)
router.get('/qr', getQRCode);

// Authenticated endpoints
router.get('/status', authenticate, getConnectionStatus);
router.post('/start', authenticate, startWhatsApp);
router.post('/disconnect', authenticate, disconnectWhatsApp);
router.get('/groups', authenticate, getGroups);

export default router;
