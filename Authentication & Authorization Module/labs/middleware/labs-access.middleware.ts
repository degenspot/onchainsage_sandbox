import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../audit/audit.service';
import { Permission } from '../../common/enums/permission.enum';

@Injectable()
export class LabsAccessMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasLabsAccess = user.permissions?.includes(Permission.ACCESS_EXPERIMENTAL);
    
    if (!hasLabsAccess) {
      await this.auditService.log({
        userId: user.id,
        action: 'UNAUTHORIZED_LABS_ACCESS_ATTEMPT',
        details: { path: req.path, method: req.method },
      });
      
      throw new ForbiddenException('Labs access required');
    }

    // Log successful labs access
    await this.auditService.log({
      userId: user.id,
      action: 'LABS_ACCESS',
      details: { path: req.path, method: req.method },
    });

    next();
  }
}