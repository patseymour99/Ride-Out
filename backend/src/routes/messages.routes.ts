import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', messagesController.getConversations);
router.post('/conversations', messagesController.getOrCreateConversation);
router.get('/conversations/:convId/messages', messagesController.getMessages);
router.post('/conversations/:convId/read', messagesController.markRead);

export default router;
