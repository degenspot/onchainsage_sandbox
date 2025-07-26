import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Influencer } from '../entities/influencer.entity';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { UpdateInfluencerDto } from './dto/update-influencer.dto';

@Injectable()
export class InfluencersService {
  constructor(
    @InjectRepository(Influencer)
    private influencersRepository: Repository<Influencer>,
  ) {}

  async create(createInfluencerDto: CreateInfluencerDto): Promise<Influencer> {
    const influencer = this.influencersRepository.create(createInfluencerDto);
    return this.influencersRepository.save(influencer);
  }

  async findAll(): Promise<Influencer[]> {
    return this.influencersRepository.find({
      relations: ['mentions'],
      order: { influenceScore: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Influencer> {
    const influencer = await this.influencersRepository.findOne({
      where: { id },
      relations: ['mentions', 'mentions.token'],
    });

    if (!influencer) {
      throw new NotFoundException(`Influencer with ID "${id}" not found`);
    }

    return influencer;
  }

  async findByTwitterHandle(twitterHandle: string): Promise<Influencer | null> {
    return this.influencersRepository.findOne({
      where: { twitterHandle },
    });
  }

  async update(id: string, updateInfluencerDto: UpdateInfluencerDto): Promise<Influencer> {
    await this.influencersRepository.update(id, updateInfluencerDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.influencersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Influencer with ID "${id}" not found`);
    }
  }

  async updateInfluenceScore(id: string, score: number): Promise<void> {
    await this.influencersRepository.update(id, { influenceScore: score });
  }

  async getActiveInfluencers(): Promise<Influencer[]> {
    return this.influencersRepository.find({
      where: { isActive: true },
    });
  }
}
