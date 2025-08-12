import { type ExceptionFilter, Catch, type ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common"
import type { Request, Response } from "express"

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = "Internal server error"
    let error = "Internal Server Error"

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse
      } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any
        message = responseObj.message || message
        error = responseObj.error || error
      }
    } else if (exception instanceof Error) {
      message = exception.message
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack)
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    }

    // Log error details
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      JSON.stringify({
        ...errorResponse,
        headers: request.headers,
        body: request.body,
        query: request.query,
        params: request.params,
      }),
    )

    response.status(status).json(errorResponse)
  }
}
