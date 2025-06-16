import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Portfolio } from './portfolio.entity';

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  symbol: string;

  @Column('enum', { enum: OrderType })
  type: OrderType;

  @Column('enum', { enum: OrderSide })
  side: OrderSide;

  @Column('decimal', { precision: 15, scale: 8 })
  quantity: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  price: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  stopPrice: number;

  @Column('decimal', { precision: 15, scale: 8, default: 0 })
  filledQuantity: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  averageFillPrice: number;

  @Column('enum', { enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ManyToOne(() => User, user => user.orders)
  user: User;

  @ManyToOne(() => Portfolio, portfolio => portfolio.orders)
  portfolio: Portfolio;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
