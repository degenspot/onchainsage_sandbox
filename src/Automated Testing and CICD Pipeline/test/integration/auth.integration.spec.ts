import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../../src/modules/auth/auth.service';
import { testDbConfig } from '../helpers/test-db.helper';
import * as bcrypt from 'bcryptjs';

describe('Auth Integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDbConfig),
        TypeOrmModule.forFeature([User]),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Authentication Flow', () => {
    it('should register and login a user', async () => {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      });
      await userRepository.save(user);

      // Validate user
      const validatedUser = await authService.validateUser(
        'test@example.com',
        'password123',
      );

      expect(validatedUser).toBeDefined();
      expect(validatedUser.email).toBe('test@example.com');

      // Login user
      const loginResult = await authService.login(validatedUser);

      expect(loginResult).toHaveProperty('access_token');
      expect(loginResult.user.email).toBe('test@example.com');
    });

    it('should fail login with invalid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      });
      await userRepository.save(user);

      await expect(
        authService.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow();
    });
  });
});