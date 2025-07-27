import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiDocsService } from './api-docs.service';
import { ApiEndpointDto } from './dto/api-endpoint.dto';

@ApiTags('API Documentation')
@Controller('api-docs')
export class ApiDocsController {
  constructor(private readonly apiDocsService: ApiDocsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all API endpoints' })
  @ApiResponse({ status: 200, type: [ApiEndpointDto] })
  async getAllEndpoints(): Promise<ApiEndpointDto[]> {
    return this.apiDocsService.getAllEndpoints();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search API endpoints' })
  @ApiResponse({ status: 200, type: [ApiEndpointDto] })
  async searchEndpoints(@Query('q') query: string): Promise<ApiEndpointDto[]> {
    return this.apiDocsService.searchEndpoints(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific API endpoint details' })
  @ApiResponse({ status: 200, type: ApiEndpointDto })
  async getEndpoint(@Param('id') id: string): Promise<ApiEndpointDto> {
    return this.apiDocsService.getEndpoint(id);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get endpoints by category' })
  @ApiResponse({ status: 200, type: [ApiEndpointDto] })
  async getEndpointsByCategory(@Param('category') category: string): Promise<ApiEndpointDto[]> {
    return this.apiDocsService.getEndpointsByCategory(category);
  }
}