import { registerAs } from '@nestjs/config';

export default registerAs('monitoring', () => ({
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || './logs',
    maxFiles: process.env.LOG_MAX_FILES || '30d',
    maxSize: process.env.LOG_MAX_SIZE || '100m',
  },
  performance: {
    threshold: parseInt(process.env.PERFORMANCE_THRESHOLD) || 5000,
    enableApm: process.env.ENABLE_APM === 'true',
  },
  alerting: {
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts',
      enabled: !!process.env.SLACK_WEBHOOK_URL,
    },
    email: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
      recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      enabled: !!process.env.SMTP_HOST,
    },
    webhook: {
      url: process.env.ALERT_WEBHOOK_URL,
      token: process.env.ALERT_WEBHOOK_TOKEN,
      enabled: !!process.env.ALERT_WEBHOOK_URL,
    },
  },
  metrics: {
    retention: {
      system: parseInt(process.env.METRICS_SYSTEM_RETENTION) || 1000,
      business: parseInt(process.env.METRICS_BUSINESS_RETENTION) || 10000,
    },
    collection: {
      systemInterval: parseInt(process.env.SYSTEM_METRICS_INTERVAL) || 30000,
      businessInterval: parseInt(process.env.BUSINESS_METRICS_INTERVAL) || 60000,
    },
  },
  health: {
    memory: {
      heapThreshold: parseInt(process.env.MEMORY_HEAP_THRESHOLD) || 150 * 1024 * 1024,
      rssThreshold: parseInt(process.env.MEMORY_RSS_THRESHOLD) || 150 * 1024 * 1024,
    },
    disk: {
      threshold: parseFloat(process.env.DISK_THRESHOLD) || 0.9,
      path: process.env.DISK_PATH || '/',
    },
  },
}));
