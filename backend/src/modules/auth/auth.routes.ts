import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import * as authCtrl from './auth.controller';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authCtrl.register);
router.post('/login', authLimiter, validate(loginSchema), authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', authCtrl.logout);
router.get('/me', authenticate, authCtrl.getMe);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authCtrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authCtrl.resetPassword);

export default router;
