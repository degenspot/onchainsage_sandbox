import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mention } from '../entities/mention.entity';

@Injectable()
export class MentionsService {
  constructor(
    @InjectRepository(Mention)
    private mentionsRepository: Repository<Mention>,
  ) {}

  async create(mentionData: any): Promise<Mention> {
    const mention = this.mentionsRepository.create(mentionData);
    return this.mentionsRepository.save(mention);
  }

  async findByTweetId(tweetId: string): Promise<Mention | null> {
    return this.mentionsRepository.findOne({
      where: { tweetId },
    });
  }

  async findRecentMentions(hours: number = 24): Promise<Mention[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.mentionsRepository.find({
      where: {
        createdAt: since,
      },
      relations: ['influencer', 'token'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMentionsByToken(tokenId: string, limit: number = 50): Promise<Mention[]> {
    return this.mentionsRepository.find({
      where: { tokenId },
      relations: ['influencer'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getMentionsByInfluencer(influencerId: string, limit: number = 50): Promise<Mention[]> {
    return this.mentionsRepository.find({
      where: { influencerId },
      relations: ['token'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
