import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler, Logger } from "@nestjs/common"
import type { Observable } from "rxjs"
import { tap } from "rxjs/operators"

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, body, query, params } = request
    const userAgent = request.get("User-Agent") || ""
    const ip = request.ip

    const now = Date.now()

    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      JSON.stringify({
        method,
        url,
        userAgent,
        ip,
        body: this.sanitizeBody(body),
        query,
        params,
      }),
    )

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now
          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${responseTime}ms`,
            JSON.stringify({
              method,
              url,
              responseTime,
              dataLength: JSON.stringify(data).length,
            }),
          )
        },
        error: (error) => {
          const responseTime = Date.now() - now
          this.logger.error(
            `Request Error: ${method} ${url} - ${responseTime}ms`,
            JSON.stringify({
              method,
              url,
              responseTime,
              error: error.message,
            }),
          )
        },
      }),
    )
  }

  private sanitizeBody(body: any): any {
    if (!body) return body

    const sanitized = { ...body }
    const sensitiveFields = ["password", "token", "secret", "key", "authorization"]

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = "***REDACTED***"
      }
    })

    return sanitized
  }
}
