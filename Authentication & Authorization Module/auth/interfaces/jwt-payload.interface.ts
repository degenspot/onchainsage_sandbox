import { UserRole } from '../../common/enums/user-role.enum';
import { Permission } from '../../common/enums/permission.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}