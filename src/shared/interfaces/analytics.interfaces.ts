export interface PerformanceMetrics {
    totalSignals: number;
    winRate: number;
    avgReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    profitFactor: number;
  }
  
  export interface SignalAnalytics {
    timeRange: string;
    performance: PerformanceMetrics;
    byType: Record<string, PerformanceMetrics>;
    byPair: Record<string, PerformanceMetrics>;
    confidenceAnalysis: ConfidenceAnalysis;
  }
  
  export interface ConfidenceAnalysis {
    highConfidence: PerformanceMetrics;
    mediumConfidence: PerformanceMetrics;
    lowConfidence: PerformanceMetrics;
  }
  
  export interface TransparencyReport {
    reportDate: Date;
    period: string;
    overallMetrics: PerformanceMetrics;
    detailedAnalysis: SignalAnalytics;
    validationSummary: ValidationSummary;
  }
  
  export interface ValidationSummary {
    totalValidations: number;
    approvedRate: number;
    avgValidationScore: number;
    validationsByType: Record<string, number>;
  }