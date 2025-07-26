import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Scenario } from './scenario.entity';

@Entity('risk_assessments')
export class RiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scenarioId: string;

  @Column('decimal', { precision: 18, scale: 8 })
  var95: number;

  @Column('decimal', { precision: 18, scale: 8 })
  var99: number;

  @Column('decimal', { precision: 18, scale: 8 })
  expectedShortfall: number;

  @Column('decimal', { precision: 18, scale: 8 })
  maxDrawdown: number;

  @Column('decimal', { precision: 10, scale: 6 })
  beta: number;

  @Column('decimal', { precision: 10, scale: 6 })
  alpha: number;

  @Column('timestamp')
  calculatedAt: Date;

  @ManyToOne(() => Scenario)
  @JoinColumn({ name: 'scenarioId' })
  scenario: Scenario;
}