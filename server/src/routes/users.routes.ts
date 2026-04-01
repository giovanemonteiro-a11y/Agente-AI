import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/users.schema';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Leadership + super_admin can manage users
const canManageUsers = authorize('super_admin', 'lideranca');

// GET /api/users
router.get('/', canManageUsers, usersController.listUsers);

// POST /api/users
router.post('/', canManageUsers, validate(createUserSchema), usersController.createUser);

// GET /api/users/:id
router.get('/:id', canManageUsers, usersController.getUserById);

// PATCH /api/users/:id
router.patch('/:id', canManageUsers, validate(updateUserSchema), usersController.updateUser);

// DELETE /api/users/:id  — only super_admin can delete
router.delete('/:id', authorize('super_admin'), usersController.deleteUser);

export default router;
