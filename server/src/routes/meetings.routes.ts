import { Router } from 'express';
import * as meetingsController from '../controllers/meetings.controller';
import { authenticate } from '../middleware/authenticate';
import { uploadAudioVideo } from '../middleware/upload';

const router = Router();

router.use(authenticate);

// ─── Client-scoped meeting routes ─────────────────────────────────────────────
// GET  /api/meetings/:clientId/meetings  — list meetings for a client (newest first)
router.get('/:clientId/meetings', meetingsController.listMeetings);

// POST /api/meetings/:clientId  — create meeting record + optional audio/video upload
router.post('/:clientId', uploadAudioVideo.single('recording'), meetingsController.createMeeting);

// ─── Legacy / flat routes ─────────────────────────────────────────────────────
// GET  /api/meetings?clientId=xxx
router.get('/', meetingsController.listMeetings);

// POST /api/meetings  — create meeting without file
router.post('/', meetingsController.createMeeting);

// GET  /api/meetings/:id
router.get('/:id', meetingsController.getMeetingById);

// POST /api/meetings/:id/upload  — upload recording to existing meeting
router.post('/:id/upload', uploadAudioVideo.single('recording'), meetingsController.uploadRecording);

// POST /api/meetings/:id/transcribe  — manually trigger transcription
router.post('/:id/transcribe', meetingsController.triggerTranscription);

// GET  /api/meetings/:id/transcript
router.get('/:id/transcript', meetingsController.getTranscript);

// GET  /api/meetings/:id/highlights  — AI highlights (Phase 3)
router.get('/:id/highlights', meetingsController.getHighlights);

export default router;
