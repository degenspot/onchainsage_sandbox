import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentionsService } from './mentions.service';
import { Mention } from '../entities/mention.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mention])],
  providers: [MentionsService],
  exports: [MentionsService],
})
export class MentionsModule {}