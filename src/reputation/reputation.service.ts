import { getRepository } from 'typeorm';
import { User } from '../entities/User';

export class ReputationService {
  static async computeWeightForUser(userId: string): Promise<number> {
    const repo = getRepository(User);
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) return 0.5; // fallback

    // Example: weight = log10(reputation + 10) / normalization
    // ensures diminishing returns for extremely high reputation
    const raw = Math.log10(Math.max(1, user.reputation) + 10);
    const weight = raw / 3; // approximate scale to 0..2
    return Math.max(0.1, weight);
  }

  static async adjustReputation(userId: string, delta: number) {
    const repo = getRepository(User);
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    user.reputation = Math.max(0, user.reputation + Math.round(delta));
    await repo.save(user);
    return user;
  }
}