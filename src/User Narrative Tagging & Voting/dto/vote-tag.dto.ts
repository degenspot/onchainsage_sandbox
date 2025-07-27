import { IsEnum, IsUUID } from "class-validator";
import { VoteType } from "../entities/tag-vote.entity";

export class VoteTagDto {
  @IsUUID()
  tagId: string;

  @IsEnum(VoteType)
  voteType: VoteType;
}
