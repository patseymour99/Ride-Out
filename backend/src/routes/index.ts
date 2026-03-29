import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import bikesRoutes from './bikes.routes';
import eventsRoutes from './events.routes';
import postsRoutes from './posts.routes';
import messagesRoutes from './messages.routes';
import notificationsRoutes from './notifications.routes';
import ebayRoutes from './ebay.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/bikes', bikesRoutes);
router.use('/events', eventsRoutes);
router.use('/posts', postsRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/ebay', ebayRoutes);

export default router;
