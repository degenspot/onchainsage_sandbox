import { PartialType } from '@nestjs/swagger';
import { CreateReputationRuleDto } from './create-reputation-rule.dto';

export class UpdateReputationRuleDto extends PartialType(CreateReputationRuleDto) {}