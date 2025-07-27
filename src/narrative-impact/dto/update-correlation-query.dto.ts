import { PartialType } from '@nestjs/swagger';
import { CorrelationQueryDto } from './correlation-query.dto';

export class UpdateCorrelationQueryDto extends PartialType(CorrelationQueryDto) {}
