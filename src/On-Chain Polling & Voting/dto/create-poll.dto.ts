import {
  IsString,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  MinLength,
  ArrayMinSize,
} from "class-validator";
import { PollType } from "../entities/poll.entity";

export class CreatePollDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(PollType)
  type: PollType;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @IsDateString()
  endDate: string;

  @IsNumber()
  @IsOptional()
  minimumTokenBalance?: number = 0;
}
