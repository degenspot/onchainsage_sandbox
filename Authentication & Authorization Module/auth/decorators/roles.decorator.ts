import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { Permission } from '../../common/enums/permission.enum';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);