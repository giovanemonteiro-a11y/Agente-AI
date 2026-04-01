import { Router } from 'express';
import * as clientsController from '../controllers/clients.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createClientSchema, updateClientSchema } from '../schemas/clients.schema';

const router = Router();

router.use(authenticate);

// GET /api/clients
router.get('/', clientsController.listClients);

// POST /api/clients
router.post('/', authorize('super_admin', 'aquisicao', 'coordenador', 'account'), validate(createClientSchema), clientsController.createClient);

// GET /api/clients/:id
router.get('/:id', clientsController.getClientById);

// PATCH /api/clients/:id
router.patch('/:id', authorize('super_admin', 'coordenador', 'account'), validate(updateClientSchema), clientsController.updateClient);

// DELETE /api/clients/:id
router.delete('/:id', authorize('super_admin'), clientsController.deleteClient);

// POST /api/clients/:id/setup-drive
router.post('/:id/setup-drive', authorize('super_admin', 'coordenador', 'account'), clientsController.setupDriveFolder);

export default router;
