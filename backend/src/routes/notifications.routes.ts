import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationsController.getNotifications);
router.post('/read-all', notificationsController.markAllRead);
router.post('/:notifId/read', notificationsController.markRead);

export default router;
