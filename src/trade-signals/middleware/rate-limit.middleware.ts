import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();
  private readonly WINDOW_SIZE = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 100; // Max requests per window

  use(req: Request, res: Response, next: NextFunction): void {
    const clientId = this.getClientId(req);
    const now = Date.now();
    
    const clientData = this.requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // Reset window for client
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + this.WINDOW_SIZE,
      });
      next();
      return;
    }
    
    if (clientData.count >= this.MAX_REQUESTS) {
      throw new HttpException(
        'Rate limit exceeded. Too many requests.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    
    clientData.count++;
    next();
  }

  private getClientId(req: Request): string {
    // Use IP address or authenticated user ID
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}