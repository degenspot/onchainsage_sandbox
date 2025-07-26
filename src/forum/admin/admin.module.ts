import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ReputationModule } from '../reputation/reputation.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ReputationModule, UsersModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}