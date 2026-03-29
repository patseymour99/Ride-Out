import { Request, Response, NextFunction } from 'express';
import * as postsService from '../services/posts.service';

export async function getFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await postsService.getFeed(req.user!.userId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getAllPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await postsService.getAllPosts(req.query as any, req.user?.userId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getUserPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await postsService.getUserPosts(req.params.userId, req.query as any, req.user?.userId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const photoUrls = (req.files as Express.Multer.File[] | undefined)?.map(
      (f) => `/uploads/${f.filename}`
    );
    const post = await postsService.createPost(req.user!.userId, { ...req.body, photoUrls });
    res.status(201).json({ success: true, data: post });
  } catch (err) { next(err); }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    await postsService.deletePost(req.params.postId, req.user!.userId);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
}

export async function likePost(req: Request, res: Response, next: NextFunction) {
  try {
    await postsService.likePost(req.params.postId, req.user!.userId);
    res.json({ success: true, data: { liked: true } });
  } catch (err) { next(err); }
}

export async function unlikePost(req: Request, res: Response, next: NextFunction) {
  try {
    await postsService.unlikePost(req.params.postId, req.user!.userId);
    res.json({ success: true, data: { liked: false } });
  } catch (err) { next(err); }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await postsService.getComments(req.params.postId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const comment = await postsService.addComment(req.params.postId, req.user!.userId, req.body.content);
    res.status(201).json({ success: true, data: comment });
  } catch (err) { next(err); }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    await postsService.deleteComment(req.params.commentId, req.user!.userId);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
}
