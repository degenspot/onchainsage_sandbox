export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface BusinessMetric {
  name: string;
  value: number;
  unit: string;
  category: string;
  timestamp: Date;
  metadata?: any;
}

export interface MetricQuery {
  name?: string;
  startTime?: Date;
  endTime?: Date;
  tags?: Record<string, string>;
  limit?: number;
}