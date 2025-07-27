import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Signal } from './signal.entity';

export enum ComponentType {
  INDICATOR = 'indicator',
  CONDITION = 'condition',
  ACTION = 'action',
  DATA_SOURCE = 'data_source'
}

@Entity('signal_components')
export class SignalComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ComponentType })
  type: ComponentType;

  @Column()
  name: string;

  @Column({ type: 'json' })
  config: Record<string, any>;

  @Column({ type: 'json' })
  position: { x: number; y: number };

  @Column({ type: 'json', nullable: true })
  connections: string[];

  @ManyToOne(() => Signal, signal => signal.components, { onDelete: 'CASCADE' })
  signal: Signal;

  @Column()
  signalId: string;
}

