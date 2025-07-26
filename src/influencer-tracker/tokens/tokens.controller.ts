import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new token' })
  create(@Body() createTokenDto: CreateTokenDto) {
    return this.tokensService.create(createTokenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tokens' })
  findAll() {
    return this.tokensService.findAll();
  }

  @Get('tracked')
  @ApiOperation({ summary: 'Get tracked tokens' })
  findTracked() {
    return this.tokensService.findTrackedTokens();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get token by ID' })
  findOne(@Param('id') id: string) {
    return this.tokensService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update token' })
  update(@Param('id') id: string, @Body() updateTokenDto: UpdateTokenDto) {
    return this.tokensService.update(id, updateTokenDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete token' })
  remove(@Param('id') id: string) {
    return this.tokensService.remove(id);
  }
}
