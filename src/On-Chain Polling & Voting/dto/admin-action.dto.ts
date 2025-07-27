import { IsEnum, IsNumber, IsDateString, IsOptional } from "class-validator";

export enum AdminAction {
  CLOSE = "close",
  EXTEND = "extend",
}

export class AdminActionDto {
  @IsNumber()
  pollId: number;

  @IsEnum(AdminAction)
  action: AdminAction;

  @IsDateString()
  @IsOptional()
  extendUntil?: string;
}
