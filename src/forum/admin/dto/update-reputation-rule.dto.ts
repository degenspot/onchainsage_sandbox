import { IsNumber } from 'class-validator';

export class UpdateReputationRuleDto {
  @IsNumber()
  points: number;
}
