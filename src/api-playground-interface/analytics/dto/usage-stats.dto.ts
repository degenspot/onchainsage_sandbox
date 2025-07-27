import { ApiProperty } from '@nestjs/swagger';

export class UsageStatsDto {
  @ApiProperty()
  totalRequests: number;

  @ApiProperty()
  requestsLast30Days: number;

  @ApiProperty()
  requestsToday: number;

  @ApiProperty()
  requestsYesterday: number;

  @ApiProperty()
  avgResponseTime: number;

  @ApiProperty()
  errorRate: number;

  @ApiProperty()
  growthRate: number;
}