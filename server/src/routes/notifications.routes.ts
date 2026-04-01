import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

// GET /api/notifications — list user's notifications
router.get('/', notificationsController.listNotifications);

// PATCH /api/notifications/:id/read — mark as read
router.patch('/:id/read', notificationsController.markAsRead);

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', notificationsController.markAllAsRead);

// GET /api/notifications/stream — SSE stream
router.get('/stream', notificationsController.streamNotifications);

export default router;
