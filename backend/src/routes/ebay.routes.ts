import { Router } from 'express';
import * as ebayController from '../controllers/ebay.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/auth', authMiddleware, ebayController.authRedirect);
router.get('/auth/callback', authMiddleware, ebayController.authCallback);
router.delete('/auth', authMiddleware, ebayController.disconnect);
router.get('/listings', authMiddleware, ebayController.getListings);
router.get('/transactions', authMiddleware, ebayController.getTransactions);
router.post('/transactions/sync', authMiddleware, ebayController.syncTransactions);
router.post('/transactions/:txId/invite', authMiddleware, ebayController.sendInvite);
router.get('/search', ebayController.searchEbay);

export default router;
