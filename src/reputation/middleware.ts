import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';

// NOTE: This is a simple auth middleware placeholder. Replace with JWT/session in production.
export async function mockAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ message: 'Missing x-user-id header for mock auth' });
  const repo = getRepository(User);
  const user = await repo.findOne({ where: { id: userId } });
  if (!user) return res.status(401).json({ message: 'Invalid user' });
  (req as any).user = user;
  next();
}