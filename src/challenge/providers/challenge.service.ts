import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Challenge } from '../entities/challenge.entity';
import { Repository } from 'typeorm';
import { CreateChallengeDto } from '../dto/create-challenge.dto';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
  ) {}

  async create(data: CreateChallengeDto) {
    const challenge = this.challengeRepo.create({
      ...data,
      type: data.type.toLowerCase() as 'trading' | 'research',
    });

    return this.challengeRepo.save(challenge);
  }

  async findAll() {
    return this.challengeRepo.find({ relations: ['participants'] });
  }

  async findActive() {
    return this.challengeRepo
      .createQueryBuilder('challenge')
      .leftJoinAndSelect('challenge.participants', 'participant')
      .where('challenge.startDate <= :now', { now: new Date() })
      .andWhere('challenge.endDate >= :now', { now: new Date() })
      .getMany();
  }
}
