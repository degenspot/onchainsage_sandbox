import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeysRepository: Repository<ApiKey>,
  ) {}

  async create(createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    const apiKey = new ApiKey();
    apiKey.key = this.generateApiKey();
    apiKey.name = createApiKeyDto.name;
    apiKey.description = createApiKeyDto.description || null;
    apiKey.permissions = createApiKeyDto.permissions || [];
    apiKey.rateLimitPerHour = createApiKeyDto.rateLimitPerHour || 1000;
    
    if (createApiKeyDto.expiresInDays) {
      apiKey.expiresAt = new Date();
      apiKey.expiresAt.setDate(apiKey.expiresAt.getDate() + createApiKeyDto.expiresInDays);
    }

    return this.apiKeysRepository.save(apiKey);
  }

  async findAll(): Promise<ApiKey[]> {
    return this.apiKeysRepository.find({
      select: ['id', 'name', 'description', 'isActive', 'permissions', 'expiresAt', 'usageCount', 'rateLimitPerHour', 'createdAt', 'updatedAt']
    });
  }

  async findOne(id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findOne({ 
      where: { id },
      select: ['id', 'name', 'description', 'isActive', 'permissions', 'expiresAt', 'usageCount', 'rateLimitPerHour', 'createdAt', 'updatedAt']
    });
    
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }
    
    return apiKey;
  }

  async findByKey(key: string): Promise<ApiKey | null> {
    return this.apiKeysRepository.findOne({ where: { key, isActive: true } });
  }

  async update(id: string, updateApiKeyDto: UpdateApiKeyDto): Promise<ApiKey> {
    const apiKey = await this.findOne(id);
    
    Object.assign(apiKey, updateApiKeyDto);
    
    return this.apiKeysRepository.save(apiKey);
  }

  async remove(id: string): Promise<void> {
    const result = await this.apiKeysRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('API key not found');
    }
  }

  async regenerate(id: string): Promise<ApiKey> {
    const apiKey = await this.findOne(id);
    apiKey.key = this.generateApiKey();
    apiKey.usageCount = 0;
    
    const fullApiKey = await this.apiKeysRepository.save(apiKey);
    return fullApiKey;
  }

  async incrementUsage(key: string): Promise<void> {
    await this.apiKeysRepository.increment({ key }, 'usageCount', 1);
  }

  async getUsageStats(id: string) {
    const apiKey = await this.findOne(id);
    
    return {
      totalRequests: apiKey.usageCount,
      rateLimitPerHour: apiKey.rateLimitPerHour,
      remainingRequests: Math.max(0, apiKey.rateLimitPerHour - apiKey.usageCount),
      utilizationPercentage: (apiKey.usageCount / apiKey.rateLimitPerHour) * 100
    };
  }

  private generateApiKey(): string {
    return 'sk_' + crypto.randomBytes(32).toString('hex');
  }
}