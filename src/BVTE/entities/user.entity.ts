import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Order } from './order.entity';
import { Strategy } from './strategy.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  hashedPassword: string;

  @OneToMany(() => Portfolio, portfolio => portfolio.user)
  portfolios: Portfolio[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Strategy, strategy => strategy.user)
  strategies: Strategy[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

