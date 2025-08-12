import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { HttpModule } from "@nestjs/axios"
import { CacheModule } from "@nestjs/cache-manager"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core"

// Configuration
import socialFeedConfig from "./config/social-feed.config"

// Entities
import { SocialPlatform } from "./entities/social-platform.entity"
import { FeedSource } from "./entities/feed-source.entity"
import { FeedItem } from "./entities/feed-item.entity"
import { UnifiedFeed } from "./entities/unified-feed.entity"

// Repositories
import { FeedItemRepository } from "./repositories/feed-item.repository"

// Services
import { FeedAggregationService } from "./services/feed-aggregation.service"
import { UnifiedFeedService } from "./services/unified-feed.service"
import { PlatformSyncService } from "./services/platform-sync.service"
import { FeedCacheService } from "./services/feed-cache.service"
import { FeedNotificationService } from "./services/feed-notification.service"

// Integrations
import { PlatformIntegrationRegistry } from "./integrations/platform-integration.registry"
import { TwitterIntegrationService } from "./integrations/twitter-integration.service"
import { InstagramIntegrationService } from "./integrations/instagram-integration.service"

// Controllers
import { FeedController } from "./controllers/feed.controller"
import { FeedSourceController } from "./controllers/feed-source.controller"
import { UnifiedFeedController } from "./controllers/unified-feed.controller"
import { HealthController } from "./controllers/health.controller"

// Auth
import { JwtAuthGuard } from "./auth/jwt-auth.guard"
import { JwtStrategy } from "./auth/jwt.strategy"

// Middleware & Filters
import { RateLimitMiddleware } from "./middleware/rate-limit.middleware"
import { HttpExceptionFilter } from "./filters/http-exception.filter"
import { LoggingInterceptor } from "./interceptors/logging.interceptor"

@Module({
  imports: [
    // Configuration
    ConfigModule.forFeature(socialFeedConfig),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("socialFeed.database.host"),
        port: configService.get("socialFeed.database.port"),
        username: configService.get("socialFeed.database.username"),
        password: configService.get("socialFeed.database.password"),
        database: configService.get("socialFeed.database.database"),
        ssl: configService.get("socialFeed.database.ssl"),
        entities: [SocialPlatform, FeedSource, FeedItem, UnifiedFeed],
        synchronize: process.env.NODE_ENV === "development", // Only in development
        logging: process.env.NODE_ENV === "development",
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([SocialPlatform, FeedSource, FeedItem, UnifiedFeed]),

    // Cache
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: "redis",
        host: configService.get("socialFeed.cache.host"),
        port: configService.get("socialFeed.cache.port"),
        password: configService.get("socialFeed.cache.password"),
        ttl: configService.get("socialFeed.cache.ttl"),
      }),
      inject: [ConfigService],
    }),

    // HTTP Client
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        timeout: 30000,
        maxRedirects: 5,
      }),
    }),

    // Events
    EventEmitterModule.forRoot(),

    // Authentication
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("socialFeed.auth.jwtSecret"),
        signOptions: {
          expiresIn: configService.get("socialFeed.auth.jwtExpiresIn"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FeedController, FeedSourceController, UnifiedFeedController, HealthController],
  providers: [
    // Repositories
    FeedItemRepository,

    // Services
    FeedAggregationService,
    UnifiedFeedService,
    PlatformSyncService,
    FeedCacheService,
    FeedNotificationService,

    // Integrations
    PlatformIntegrationRegistry,
    TwitterIntegrationService,
    InstagramIntegrationService,

    // Auth
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Default to JWT auth, can be overridden with ApiKeyAuthGuard
    },

    // Global filters and interceptors
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [
    FeedAggregationService,
    UnifiedFeedService,
    PlatformSyncService,
    FeedCacheService,
    PlatformIntegrationRegistry,
  ],
})
export class SocialFeedAggregatorModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes("social-feed/*")
  }
}
