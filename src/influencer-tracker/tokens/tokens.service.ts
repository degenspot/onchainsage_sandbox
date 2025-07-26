mport { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entities/token.entity';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private tokensRepository: Repository<Token>,
  ) {}

  async create(createTokenDto: CreateTokenDto): Promise<Token> {
    const token = this.tokensRepository.create(createTokenDto);
    return this.tokensRepository.save(token);
  }

  async findAll(): Promise<Token[]> {
    return this.tokensRepository.find({
      relations: ['mentions', 'priceData'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Token> {
    const token = await this.tokensRepository.findOne({
      where: { id },
      relations: ['mentions', 'mentions.influencer', 'priceData'],
    });

    if (!token) {
      throw new NotFoundException(`Token with ID "${id}" not found`);
    }

    return token;
  }

  async findBySymbol(symbol: string): Promise<Token | null> {
    return this.tokensRepository.findOne({
      where: { symbol: symbol.toUpperCase() },
    });
  }

  async findTrackedTokens(): Promise<Token[]> {
    return this.tokensRepository.find({
      where: { isTracked: true },
    });
  }

  async update(id: string, updateTokenDto: UpdateTokenDto): Promise<Token> {
    await this.tokensRepository.update(id, updateTokenDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tokensRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Token with ID "${id}" not found`);
    }
  }

  async searchByKeywords(content: string): Promise<Token[]> {
    const words = content.toLowerCase().split(/\s+/);
    const tokens = await this.tokensRepository.find();
    
    return tokens.filter(token => {
      const tokenKeywords = [...token.keywords, token.symbol.toLowerCase(), token.name.toLowerCase()];
      return tokenKeywords.some(keyword => 
        words.some(word => word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word))
      );
    });
  }
}