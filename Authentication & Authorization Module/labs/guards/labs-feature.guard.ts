import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Permission } from '../../common/enums/permission.enum';

@Injectable()
export class LabsFeatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasLabsAccess = user.permissions.includes(Permission.ACCESS_EXPERIMENTAL);
    
    if (!hasLabsAccess) {
      throw new ForbiddenException('Labs access required');
    }

    return true;
  }
}