import { PartialType } from '@nestjs/mapped-types';
import { CreateNewsVerificationDto } from './create-news-verification.dto';

export class UpdateNewsVerificationDto extends PartialType(CreateNewsVerificationDto) {}
