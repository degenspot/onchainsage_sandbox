import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { ApiKey } from './entities/api-key.entity';

@ApiTags('API Keys Management')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create new API key' })
  @ApiResponse({ status: 201, type: ApiKey })
  async create(@Body() createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    return this.apiKeysService.create(createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({ status: 200, type: [ApiKey] })
  async findAll(): Promise<ApiKey[]> {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiResponse({ status: 200, type: ApiKey })
  async findOne(@Param('id') id: string): Promise<ApiKey> {
    return this.apiKeysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update API key' })
  @ApiResponse({ status: 200, type: ApiKey })
  async update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto): Promise<ApiKey> {
    return this.apiKeysService.update(id, updateApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.apiKeysService.remove(id);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate API key' })
  @ApiResponse({ status: 200, type: ApiKey })
  async regenerate(@Param('id') id: string): Promise<ApiKey> {
    return this.apiKeysService.regenerate(id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get API key usage statistics' })
  @ApiResponse({ status: 200 })
  async getUsage(@Param('id') id: string) {
    return this.apiKeysService.getUsageStats(id);
  }
}