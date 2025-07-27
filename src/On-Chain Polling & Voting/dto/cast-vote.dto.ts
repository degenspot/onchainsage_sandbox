import { IsNumber, IsString, Min } from "class-validator";

export class CastVoteDto {
  @IsNumber()
  pollId: number;

  @IsNumber()
  @Min(0)
  optionIndex: number;

  @IsString()
  signature: string;
}
