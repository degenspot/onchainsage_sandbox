import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitingService } from '../rate-limiting.service';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitingService: RateLimitingService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new HttpException('API key required', HttpStatus.UNAUTHORIZED);
    }

    const keyData = await this.apiKeysService.findByKey(apiKey);
    if (!keyData) {
      throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
    }

    const isAllowed = await this.rateLimitingService.checkRateLimit(apiKey, keyData.rateLimitPerHour);
    
    if (!isAllowed) {
      const rateLimitInfo = await this.rateLimitingService.getRateLimitInfo(apiKey);
      
      throw new HttpException({
        message: 'Rate limit exceeded',
        rateLimitInfo
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    // Increment usage counter
    await this.apiKeysService.incrementUsage(apiKey);

    return true;
  }
}