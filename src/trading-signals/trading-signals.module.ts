import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalService } from './services/signal.service';
import { SignalTestService } from './services/signal-test.service';
import { SignalController } from './controllers/signal.controller';
import { SignalTestController } from './controllers/signal-test.controller';
import { Signal } from './entities/signal.entity';
import { SignalComponent } from './entities/signal-component.entity';
import { SignalTest } from './entities/signal-test.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Signal, SignalComponent, SignalTest]),
  ],
  controllers: [SignalController, SignalTestController],
  providers: [SignalService, SignalTestService],
  exports: [SignalService, SignalTestService],
})
export class TradingSignalsModule {}