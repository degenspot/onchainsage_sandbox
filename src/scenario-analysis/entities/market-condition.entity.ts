import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Scenario } from './scenario.entity';

@Entity('market_conditions')
export class MarketConditionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scenarioId: string;

  @Column()
  symbol: string;

  @Column('decimal', { precision: 18, scale: 8 })
  price: number;

  @Column('decimal', { precision: 10, scale: 6 })
  volatility: number;

  @Column('bigint')
  volume: number;

  @Column('timestamp')
  timestamp: Date;

  @ManyToOne(() => Scenario)
  @JoinColumn({ name: 'scenarioId' })
  scenario: Scenario;
}