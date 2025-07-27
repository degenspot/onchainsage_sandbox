import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const keyData = await this.apiKeysService.findByKey(apiKey);
    
    if (!keyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!keyData.isActive) {
      throw new UnauthorizedException('API key is deactivated');
    }

    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Attach API key data to request for further use
    request.apiKeyData = keyData;

    return true;
  }
}