import { Router } from 'express';
import * as postsController from '../controllers/posts.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadImage } from '../config/multer';

const router = Router();

router.get('/feed', authMiddleware, postsController.getFeed);
router.get('/user/:userId', postsController.getUserPosts);
router.get('/', postsController.getAllPosts);
router.post('/', authMiddleware, uploadImage.array('photos', 10), postsController.createPost);
router.delete('/:postId', authMiddleware, postsController.deletePost);
router.post('/:postId/like', authMiddleware, postsController.likePost);
router.delete('/:postId/like', authMiddleware, postsController.unlikePost);
router.get('/:postId/comments', postsController.getComments);
router.post('/:postId/comments', authMiddleware, postsController.addComment);
router.delete('/:postId/comments/:commentId', authMiddleware, postsController.deleteComment);

export default router;
