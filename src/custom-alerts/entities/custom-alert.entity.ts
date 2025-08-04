import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';

export enum AlertType {
  PRICE = 'price',
  VOLUME = 'volume',
  NARRATIVE = 'narrative',
  WHALE_ACTIVITY = 'whale_activity',
}

export enum AlertCondition {
  ABOVE = 'above',
  BELOW = 'below',
  PERCENTAGE_CHANGE = 'percentage_change',
  ABSOLUTE_CHANGE = 'absolute_change',
  VOLUME_SPIKE = 'volume_spike',
  WHALE_MOVEMENT = 'whale_movement',
  NARRATIVE_TRENDING = 'narrative_trending',
  NARRATIVE_SENTIMENT = 'narrative_sentiment',
}

export enum AlertStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
}

@Entity('custom_alerts')
@Index(['userId', 'status'])
@Index(['alertType', 'status'])
@Index(['createdAt'])
export class CustomAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  alertType: AlertType;

  @Column({
    type: 'enum',
    enum: AlertCondition,
  })
  condition: AlertCondition;

  @Column('json')
  parameters: {
    symbol?: string;
    threshold?: number;
    percentage?: number;
    timeWindow?: number; // in minutes
    whaleAddress?: string;
    narrativeName?: string;
    sentimentThreshold?: number;
    volumeThreshold?: number;
    priceThreshold?: number;
  };

  @Column('simple-array')
  notificationChannels: NotificationChannel[];

  @Column('json')
  notificationConfig: {
    email?: string;
    phone?: string;
    webhookUrl?: string;
    pushToken?: string;
  };

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ default: false })
  isShared: boolean;

  @Column({ nullable: true })
  sharedId: string; // For sharing alert configurations

  @Column({ default: 0 })
  triggerCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @Column({ default: true })
  isEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 