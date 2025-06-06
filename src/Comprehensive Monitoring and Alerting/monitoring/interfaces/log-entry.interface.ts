export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: any;
  correlationId?: string;
  userId?: string;
  requestId?: string;
}

export interface LogQuery {
  level?: string;
  context?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  search?: string;
  correlationId?: string;
}