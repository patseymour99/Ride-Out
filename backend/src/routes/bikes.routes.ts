import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createBikeSchema } from '@ride-out/shared';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bikes = await prisma.bike.findMany({ where: { userId: req.user!.userId } });
    res.json({ success: true, data: bikes });
  } catch (err) { next(err); }
});

router.post('/', validate(createBikeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bike = await prisma.bike.create({ data: { userId: req.user!.userId, ...req.body } });
    res.status(201).json({ success: true, data: bike });
  } catch (err) { next(err); }
});

router.put('/:bikeId', validate(createBikeSchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bike = await prisma.bike.findUnique({ where: { id: req.params.bikeId } });
    if (!bike) throw new AppError(404, 'BIKE_NOT_FOUND', 'Bike not found');
    if (bike.userId !== req.user!.userId) throw new AppError(403, 'FORBIDDEN', 'Not your bike');
    const updated = await prisma.bike.update({ where: { id: req.params.bikeId }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/:bikeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bike = await prisma.bike.findUnique({ where: { id: req.params.bikeId } });
    if (!bike) throw new AppError(404, 'BIKE_NOT_FOUND', 'Bike not found');
    if (bike.userId !== req.user!.userId) throw new AppError(403, 'FORBIDDEN', 'Not your bike');
    await prisma.bike.delete({ where: { id: req.params.bikeId } });
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
