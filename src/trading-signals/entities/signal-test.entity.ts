import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Signal } from './signal.entity';

export enum TestStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('signal_tests')
export class SignalTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  parameters: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  results: Record<string, any>;

  @Column({ type: 'enum', enum: TestStatus, default: TestStatus.RUNNING })
  status: TestStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @ManyToOne(() => Signal, signal => signal.tests, { onDelete: 'CASCADE' })
  signal: Signal;

  @Column()
  signalId: string;

  @CreateDateColumn()
  createdAt: Date;
}