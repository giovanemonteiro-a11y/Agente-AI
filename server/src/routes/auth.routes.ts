import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from '../schemas/auth.schema';

const router = Router();

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/change-password
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// PATCH /api/auth/reset-password (forced password reset flow)
router.patch('/reset-password', authenticate, authController.resetPassword);

// Google OAuth2
router.get('/google', authController.googleAuthUrl);
router.get('/google/callback', authController.googleCallback);

export default router;
