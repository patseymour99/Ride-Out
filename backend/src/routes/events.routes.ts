import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createEventSchema } from '@ride-out/shared';
import { uploadGpx } from '../config/multer';

const router = Router();

router.get('/', eventsController.listEvents);
router.get('/:eventId', eventsController.getEvent);
router.post('/', authMiddleware, validate(createEventSchema), eventsController.createEvent);
router.put('/:eventId', authMiddleware, eventsController.updateEvent);
router.delete('/:eventId', authMiddleware, eventsController.cancelEvent);
router.post('/:eventId/join', authMiddleware, eventsController.joinEvent);
router.delete('/:eventId/join', authMiddleware, eventsController.leaveEvent);
router.post('/:eventId/gpx', authMiddleware, uploadGpx.single('gpx'), eventsController.uploadGpx);

export default router;
