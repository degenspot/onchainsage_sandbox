import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SignalService } from '../services/signal.service';
import { CreateSignalDto } from '../dto/create-signal.dto';
import { UpdateSignalDto } from '../dto/update-signal.dto';
import { SignalQueryDto } from '../dto/signal-query.dto';
import { CreateSignalComponentDto } from '../dto/create-signal-component.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('signals')
@UseGuards(JwtAuthGuard)
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Post()
  create(@Body() createSignalDto: CreateSignalDto, @Request() req) {
    return this.signalService.create(createSignalDto, req.user.id);
  }

  @Get()
  findAll(@Query() query: SignalQueryDto) {
    return this.signalService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.signalService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSignalDto: UpdateSignalDto, @Request() req) {
    return this.signalService.update(id, updateSignalDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.signalService.remove(id, req.user.id);
  }

  @Post(':id/components')
  addComponent(
    @Param('id') id: string,
    @Body() componentDto: CreateSignalComponentDto,
    @Request() req,
  ) {
    return this.signalService.addComponent(id, componentDto, req.user.id);
  }

  @Delete(':id/components/:componentId')
  removeComponent(
    @Param('id') id: string,
    @Param('componentId') componentId: string,
    @Request() req,
  ) {
    return this.signalService.removeComponent(id, componentId, req.user.id);
  }

  @Get(':id/validate')
  validateSignal(@Param('id') id: string) {
    return this.signalService.validateSignal(id);
  }

  @Post(':id/share')
  shareSignal(@Param('id') id: string, @Request() req) {
    return this.signalService.shareSignal(id, req.user.id);
  }

  @Post(':id/like')
  likeSignal(@Param('id') id: string) {
    return this.signalService.likeSignal(id);
  }
}
