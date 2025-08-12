import { Injectable, Logger } from "@nestjs/common"
import type { ISocialPlatformIntegration } from "../interfaces/social-platform-integration.interface"
import type { TwitterIntegrationService } from "./twitter-integration.service"
import type { InstagramIntegrationService } from "./instagram-integration.service"

@Injectable()
export class PlatformIntegrationRegistry {
  private readonly logger = new Logger(PlatformIntegrationRegistry.name)
  private readonly integrations = new Map<string, ISocialPlatformIntegration>()

  constructor(
    private readonly twitterIntegration: TwitterIntegrationService,
    private readonly instagramIntegration: InstagramIntegrationService,
  ) {
    this.registerIntegrations()
  }

  private registerIntegrations(): void {
    this.register(this.twitterIntegration)
    this.register(this.instagramIntegration)

    this.logger.log(`Registered ${this.integrations.size} platform integrations`)
  }

  register(integration: ISocialPlatformIntegration): void {
    this.integrations.set(integration.platformId, integration)
    this.logger.log(`Registered integration for platform: ${integration.platformName}`)
  }

  getIntegration(platformId: string): ISocialPlatformIntegration | undefined {
    return this.integrations.get(platformId)
  }

  getAllIntegrations(): ISocialPlatformIntegration[] {
    return Array.from(this.integrations.values())
  }

  getSupportedPlatforms(): string[] {
    return Array.from(this.integrations.keys())
  }

  hasIntegration(platformId: string): boolean {
    return this.integrations.has(platformId)
  }
}
