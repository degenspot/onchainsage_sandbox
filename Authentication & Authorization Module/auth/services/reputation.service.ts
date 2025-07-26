import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReputationRule } from "Authentication & Authorization Module/auth/entities/reputationRulle.entity";
import { User } from "Authentication & Authorization Module/users/entities/user.entity";
import { Repository } from "typeorm";
import { UpdateReputationRuleDto } from "../dto/update-reputation-rule.dto";
import { CreateReputationRuleDto } from "../dto/create-reputation-rule.dto";

@Injectable()
export class ReputationService {
  save(dto: CreateReputationRuleDto) {
    throw new Error('Method not implemented.');
  }
  update(id: number, dto: UpdateReputationRuleDto) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ReputationRule) private ruleRepo: Repository<ReputationRule>,
  ) {}

  async calculateReputation(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['posts', 'comments'] });
    const rules = await this.ruleRepo.find({ where: { active: true } });

    let score = 0;

    if (!user) {
      throw new Error(`User with id ${userId} not found.`);
    }

    for (const rule of rules) {
      if (rule.type === 'community') {
        score += rule.points * ((user.posts?.length ?? 0) + (user.comments?.length ?? 0));
      }
      // Optional: fetch on-chain activity from provider or The Graph, and apply rules
    }

    user.reputationScore = score;
    user.reputationBadge = score > 100 ? 'gold' : score > 50 ? 'silver' : 'bronze';

    return this.userRepo.save(user);
  }
}