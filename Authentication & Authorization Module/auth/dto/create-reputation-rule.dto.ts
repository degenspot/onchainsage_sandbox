import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';

export enum ReputationEventType {
  POST_CREATED = 'POST_CREATED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  POST_UPVOTED = 'POST_UPVOTED',
  COMMENT_UPVOTED = 'COMMENT_UPVOTED',
  POST_DOWNVOTED = 'POST_DOWNVOTED',
  COMMENT_DOWNVOTED = 'COMMENT_DOWNVOTED',
  CHALLENGE_WON = 'CHALLENGE_WON',
  CONTRIBUTION_APPROVED = 'CONTRIBUTION_APPROVED',
}

export class CreateReputationRuleDto {
  @ApiProperty({
    enum: ReputationEventType,
    description: 'The type of event that triggers a reputation change',
    example: ReputationEventType.POST_CREATED,
  })
  @IsEnum(ReputationEventType)
  eventType: ReputationEventType;

  @ApiProperty({
    description: 'Number of reputation points awarded or removed (can be negative)',
    example: 10,
  })
  @IsInt()
  points: number;
}