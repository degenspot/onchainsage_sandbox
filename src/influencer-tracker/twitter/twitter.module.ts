import { Module } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { MentionsModule } from '../mentions/mentions.module';
import { InfluencersModule } from '../influencers/influencers.module';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports: [MentionsModule, InfluencersModule, TokensModule],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}