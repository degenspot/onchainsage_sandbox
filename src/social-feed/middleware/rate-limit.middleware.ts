import { Injectable, type NestMiddleware, HttpException, HttpStatus } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {}
  private readonly windowMs = 15 * 60 * 1000 // 15 minutes
  private readonly maxRequests = 1000 // requests per window

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.getKey(req)
    const now = Date.now()

    // Clean up expired entries
    this.cleanup(now)

    // Get or create rate limit entry
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs,
      }
    }

    const entry = this.store[key]

    // Reset if window has expired
    if (now > entry.resetTime) {
      entry.count = 0
      entry.resetTime = now + this.windowMs
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000)

      res.set({
        "X-RateLimit-Limit": this.maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetTimeSeconds.toString(),
      })

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: "Too many requests",
          error: "Rate limit exceeded",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    // Increment counter
    entry.count++

    // Set rate limit headers
    const remaining = Math.max(0, this.maxRequests - entry.count)
    const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000)

    res.set({
      "X-RateLimit-Limit": this.maxRequests.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": resetTimeSeconds.toString(),
    })

    next()
  }

  private getKey(req: Request): string {
    // Use IP address and user ID (if available) as key
    const ip = req.ip || req.connection.remoteAddress || "unknown"
    const userId = (req as any).user?.id || "anonymous"
    return `${ip}:${userId}`
  }

  private cleanup(now: number) {
    Object.keys(this.store).forEach((key) => {
      if (now > this.store[key].resetTime + this.windowMs) {
        delete this.store[key]
      }
    })
  }
}
