import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  symbol: string;

  @Column('decimal', { precision: 15, scale: 8 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2 })
  averagePrice: number;

  @Column('decimal', { precision: 15, scale: 2 })
  currentPrice: number;

  @Column('decimal', { precision: 15, scale: 2 })
  marketValue: number;

  @Column('decimal', { precision: 15, scale: 2 })
  unrealizedPnL: number;

  @Column('decimal', { precision: 5, scale: 4 })
  unrealizedReturn: number;

  @ManyToOne(() => Portfolio, portfolio => portfolio.positions)
  portfolio: Portfolio;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
