import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ReputationService } from '../reputation/reputation.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('AdminService', () => {
  let service: AdminService;
  let reputationService: jest.Mocked<ReputationService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockReputationService = {
      updateReputationRule: jest.fn(),
      getLeaderboard: jest.fn(),
    };

    const mockUsersService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: ReputationService, useValue: mockReputationService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    reputationService = module.get(ReputationService);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateReputationRule', () => {
    it('should throw ForbiddenException for non-admin users', async () => {
      const user = { role: UserRole.USER } as User;
      const updateDto = { points: 15 };

      await expect(service.updateReputationRule(1, updateDto, user)).rejects.toThrow(ForbiddenException);
    });

    it('should update reputation rule for admin users', async () => {
      const admin = { role: UserRole.ADMIN } as User;
      const updateDto = { points: 15 };
      const updatedRule = { id: 1, points: 15 };

      reputationService.updateReputationRule.mockResolvedValue(updatedRule as any);

      const result = await service.updateReputationRule(1, updateDto, admin);

      expect(reputationService.updateReputationRule).toHaveBeenCalledWith(1, 15);
      expect(result).toEqual(updatedRule);
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics for admin', async () => {
      const admin = { role: UserRole.ADMIN } as User;
      const users = [
        { id: 1, isActive: true },
        { id: 2, isActive: false },
        { id: 3, isActive: true },
      ];
      const leaderboard = [{ id: 1, totalScore: 1000 }];

      usersService.findAll.mockResolvedValue(users as any);
      reputationService.getLeaderboard.mockResolvedValue(leaderboard as any);

      const result = await service.getSystemStats(admin);

      expect(result).toEqual({
        totalUsers: 3,
        activeUsers: 2,
        topUsers: leaderboard,
      });
    });
  });
});