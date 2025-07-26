import { PartialType } from '@nestjs/swagger';
import { CreateInfluencerDto } from './create-influencer.dto';

export class UpdateInfluencerDto extends PartialType(CreateInfluencerDto) {}

// src/tokens/tokens.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { Token } from '../entities/token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Token])],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
