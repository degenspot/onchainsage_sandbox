import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SignalTrackingService } from '../services/signal-tracking.service';
import { SignalValidationService } from '../services/signal-validation.service';
import { CreateSignalDto } from '../dto/create-signal.dto';
import { ValidationType } from '../../../shared/enums/signal.enums';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('signals')
// @UseGuards(JwtAuthGuard)
export class SignalTrackingController {
  constructor(
    private readonly signalTrackingService: SignalTrackingService,
    private readonly validationService: SignalValidationService,
  ) {}

  @Post()
  async createSignal(@Body() createSignalDto: CreateSignalDto) {
    return await this.signalTrackingService.createSignal(createSignalDto);
  }

  @Get(':id')
  async getSignal(@Param('id') id: string) {
    return await this.signalTrackingService.findSignalById(id);
  }

  @Put(':id/exit')
  async updateSignalExit(
    @Param('id') id: string,
    @Body('exitPrice') exitPrice: number,
  ) {
    return await this.signalTrackingService.updateSignalExit(id, exitPrice);
  }

  @Post(':id/validate')
  async validateSignal(
    @Param('id') signalId: string,
    @Body('validationType') validationType: ValidationType,
    @Body('validatedBy') validatedBy: string,
    @Body('validationData') validationData?: Record<string, any>,
  ) {
    const validation = await this.validationService.validateSignal(
      signalId,
      validationType,
      validatedBy,
      validationData,
    );
    
    // Update signal confidence based on new validation
    await this.validationService.updateSignalConfidence(signalId);
    
    return validation;
  }

  @Get(':id/validations')
  async getSignalValidations(@Param('id') signalId: string) {
    return await this.validationService.getSignalValidations(signalId);
  }

  @Get()
  async getSignals(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate && endDate) {
      return await this.signalTrackingService.getSignalsByDateRange(
        new Date(startDate),
        new Date(endDate),
      );
    }
    
    // Return recent signals if no date range specified
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    return await this.signalTrackingService.getSignalsByDateRange(
      defaultStartDate,
      defaultEndDate,
    );
  }
}