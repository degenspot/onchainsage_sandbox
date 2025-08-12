import { Controller, Get } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { Public } from "../decorators/public.decorator"

@ApiTags("Health")
@Controller("social-feed/health")
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "social-feed-aggregator",
      version: "1.0.0",
    }
  }

  @Get("detailed")
  @Public()
  @ApiOperation({ summary: "Detailed health check" })
  @ApiResponse({ status: 200, description: "Detailed service health information" })
  getDetailedHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "social-feed-aggregator",
      version: "1.0.0",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: "ok", // In real implementation, check database connection
        cache: "ok", // In real implementation, check cache connection
        externalApis: "ok", // In real implementation, check external API connectivity
      },
    }
  }
}
