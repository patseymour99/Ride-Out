import { Router } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authRateLimit } from '../middleware/rate-limit.middleware';
import { registerSchema, loginSchema } from '@ride-out/shared';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

export default router;
