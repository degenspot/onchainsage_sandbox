import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaggingController } from "./tagging.controller";
import { TaggingService } from "./tagging.service";
import { Tag } from "./entities/tag.entity";
import { TagVote } from "./entities/tag-vote.entity";
import { TagFlag } from "./entities/tag-flag.entity";
import { Narrative } from "./entities/narrative.entity";
import { User } from "./entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Tag, TagVote, TagFlag, Narrative, User])],
  controllers: [TaggingController],
  providers: [TaggingService],
  exports: [TaggingService],
})
export class TaggingModule {}
