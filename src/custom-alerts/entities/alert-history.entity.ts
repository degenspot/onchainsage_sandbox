import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { CustomAlert } from './custom-alert.entity';

export enum AlertTriggerStatus {
  TRIGGERED = 'triggered',
  FALSE_POSITIVE = 'false_positive',
  MISSED = 'missed',
}

@Entity('alert_history')
@Index(['alertId', 'triggeredAt'])
@Index(['userId', 'triggeredAt'])
@Index(['status'])
export class AlertHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  alertId: string;

  @Column()
  userId: string;

  @Column()
  alertName: string;

  @Column({
    type: 'enum',
    enum: AlertTriggerStatus,
  })
  status: AlertTriggerStatus;

  @Column('json')
  triggerData: {
    currentValue: number;
    threshold: number;
    symbol?: string;
    narrativeName?: string;
    whaleAddress?: string;
    volume?: number;
    price?: number;
    sentiment?: number;
  };

  @Column('json')
  notificationResults: {
    email?: { sent: boolean; error?: string };
    sms?: { sent: boolean; error?: string };
    push?: { sent: boolean; error?: string };
    webhook?: { sent: boolean; error?: string };
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  triggeredAt: Date;
} 