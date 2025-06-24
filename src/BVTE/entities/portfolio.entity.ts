import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Position } from './position.entity';
import { Order } from './order.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 15, scale: 2, default: 100000 })
  initialBalance: number;

  @Column('decimal', { precision: 15, scale: 2 })
  currentBalance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPnL: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  totalReturn: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, user => user.portfolios)
  user: User;

  @OneToMany(() => Position, position => position.portfolio)
  positions: Position[];

  @OneToMany(() => Order, order => order.portfolio)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}