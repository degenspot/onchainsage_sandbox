import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketDataService } from './market-data.service';
import { PriceData } from '../entities/price-data.entity';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports: [TypeOrmModule.forFeature([PriceData]), TokensModule],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}