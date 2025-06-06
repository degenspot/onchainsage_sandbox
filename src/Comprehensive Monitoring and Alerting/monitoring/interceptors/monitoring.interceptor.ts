import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MonitoringInterceptor.name);

  constructor(private monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const handler = context.getHandler().name;
    const controller = context.getClass().name;

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        // Track performance
        await this.monitoringService.trackPerformance(
          `${controller}.${handler}`,
          duration,
          { method, url, statusCode: 200 }
        );
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        
        // Track error and performance
        await this.monitoringService.trackError(error, `${controller}.${handler}`);
        await this.monitoringService.trackPerformance(
          `${controller}.${handler}`,
          duration,
          { method, url, statusCode: error.status || 500, error: true }
        );
        
        throw error;
      }),
    );
  }
}
