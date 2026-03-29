import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadImage } from '../config/multer';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema } from '@ride-out/shared';

const router = Router();

router.get('/search', authMiddleware, usersController.searchUsers);
router.get('/me', authMiddleware, usersController.getMe);
router.put('/me', authMiddleware, validate(updateProfileSchema), usersController.updateMe);
router.post('/me/avatar', authMiddleware, uploadImage.single('avatar'), usersController.uploadAvatar);
router.get('/:userId', usersController.getProfile);
router.get('/:userId/followers', usersController.getFollowers);
router.get('/:userId/following', usersController.getFollowing);
router.post('/:userId/follow', authMiddleware, usersController.follow);
router.delete('/:userId/follow', authMiddleware, usersController.unfollow);

export default router;
