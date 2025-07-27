import { ApiProperty } from '@nestjs/swagger';

export class ApiParameterDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  in: 'path' | 'query' | 'header' | 'body';

  @ApiProperty()
  required: boolean;

  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  example?: any;
}

export class ApiResponseDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  example?: any;
}

export class ApiEndpointDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  method: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ type: [ApiParameterDto] })
  parameters: ApiParameterDto[];

  @ApiProperty({ required: false })
  requestBody?: any;

  @ApiProperty({ type: 'object', additionalProperties: { type: ApiResponseDto } })
  responses: Record<string, ApiResponseDto>;

  @ApiProperty()
  authentication: boolean;

  @ApiProperty()
  rateLimit: {
    requests: number;
    window: string;
  };
}