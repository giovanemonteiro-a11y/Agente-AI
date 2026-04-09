import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  listClientKnowledge,
  getKnowledgeDoc,
  generateKnowledgeDoc,
  syncClientVault,
} from '../controllers/knowledge.controller';

const router = Router();

router.use(authenticate);

router.get('/:clientId', listClientKnowledge);
router.get('/:clientId/:docType', getKnowledgeDoc);
router.post('/:clientId/generate/:docType', generateKnowledgeDoc);
router.post('/:clientId/sync', syncClientVault);

export default router;
