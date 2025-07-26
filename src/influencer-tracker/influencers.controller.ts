import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InfluencersService } from './influencers.service';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { UpdateInfluencerDto } from './dto/update-influencer.dto';

@ApiTags('influencers')
@Controller('influencers')
export class InfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new influencer' })
  @ApiResponse({ status: 201, description: 'Influencer created successfully.' })
  create(@Body() createInfluencerDto: CreateInfluencerDto) {
    return this.influencersService.create(createInfluencerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all influencers' })
  findAll() {
    return this.influencersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get influencer by ID' })
  findOne(@Param('id') id: string) {
    return this.influencersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update influencer' })
  update(@Param('id') id: string, @Body() updateInfluencerDto: UpdateInfluencerDto) {
    return this.influencersService.update(id, updateInfluencerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete influencer' })
  remove(@Param('id') id: string) {
    return this.influencersService.remove(id);
  }
}