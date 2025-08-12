import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ScheduleModule } from "@nestjs/schedule"

// Entities
import { Blockchain } from "./entities/blockchain.entity"
import { Token } from "./entities/token.entity"
import { TokenAnalytics } from "./entities/token-analytics.entity"
import { TokenTransaction } from "./entities/token-transaction.entity"
import { TokenHolder } from "./entities/token-holder.entity"

// Services
import { CacheService } from "./services/analytics/cache.service"

// Controllers
import { CrossChainController } from "./controllers/cross-chain.controller"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "token_explorer",
      entities: [Blockchain, Token, TokenAnalytics, TokenTransaction, TokenHolder],
      synchronize: process.env.NODE_ENV !== "production",
      logging: process.env.NODE_ENV === "development",
    }),
    TypeOrmModule.forFeature([Blockchain, Token, TokenAnalytics, TokenTransaction, TokenHolder]),
  ],
  controllers: [CrossChainController],
  providers: [CacheService],
})
export class AppModule {}
