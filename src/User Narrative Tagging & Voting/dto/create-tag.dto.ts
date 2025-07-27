import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Length,
} from "class-validator";

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @IsUUID()
  narrativeId: string;
}
