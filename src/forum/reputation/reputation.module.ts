import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { ReputationRule } from './entities/reputation-rule.entity';
import { ReputationScore } from './entities/reputation-score.entity';
import { Badge } from './entities/badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReputationRule, ReputationScore, Badge])],
  providers: [ReputationService],
  controllers: [ReputationController],
  exports: [ReputationService],
})
export class ReputationModule {}