import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword } from '../common/utils/bcrypt.utils';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/enums/permission.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await hashPassword(createUserDto.password);
    
    const permissions = this.getPermissionsByRole(createUserDto.role || UserRole.BASIC_USER);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      permissions,
    });
    
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  private getPermissionsByRole(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.ADMIN:
        return [Permission.READ_LABS, Permission.WRITE_LABS, Permission.ADMIN_LABS, Permission.ACCESS_EXPERIMENTAL];
      case UserRole.LAB_USER:
        return [Permission.READ_LABS, Permission.WRITE_LABS, Permission.ACCESS_EXPERIMENTAL];
      case UserRole.BASIC_USER:
        return [Permission.READ_LABS];
      default:
        return [];
    }
  }
}