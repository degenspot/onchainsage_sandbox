import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { BacktestResult } from './backtest-result.entity';

@Entity('strategies')
export class Strategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('jsonb')
  parameters: Record<string, any>;

  @Column('text')
  code: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  uses: number;

  @ManyToOne(() => User, user => user.strategies)
  user: User;

  @OneToMany(() => BacktestResult, result => result.strategy)
  backtestResults: BacktestResult[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
