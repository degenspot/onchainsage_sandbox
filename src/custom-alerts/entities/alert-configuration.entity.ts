import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AlertType, AlertCondition, NotificationChannel } from './custom-alert.entity';

@Entity('alert_configurations')
@Index(['isPublic', 'category'])
@Index(['createdBy', 'isPublic'])
export class AlertConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string; // e.g., 'price_alerts', 'whale_tracking', 'narrative_monitoring'

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
  defaultParameters: {
    symbol?: string;
    threshold?: number;
    percentage?: number;
    timeWindow?: number;
    whaleAddress?: string;
    narrativeName?: string;
    sentimentThreshold?: number;
    volumeThreshold?: number;
    priceThreshold?: number;
  };

  @Column('simple-array')
  supportedChannels: NotificationChannel[];

  @Column('json')
  exampleConfig: {
    name: string;
    description: string;
    parameters: any;
    notificationChannels: NotificationChannel[];
  };

  @Column({ default: false })
  isPublic: boolean;

  @Column()
  createdBy: string;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: 0 })
  rating: number; // Average rating from users

  @Column({ default: 0 })
  ratingCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 