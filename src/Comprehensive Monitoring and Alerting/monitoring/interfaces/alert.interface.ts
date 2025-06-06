export interface Alert {
  type: 'error' | 'performance' | 'security' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: any;
  timestamp?: Date;
  source?: string;
}

export interface AlertChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: any;
  enabled: boolean;
}

export interface AlertHistory {
  id: string;
  alert: Alert;
  sentAt: Date;
  channels: string[];
  status: 'sent' | 'failed' | 'pending';
}
