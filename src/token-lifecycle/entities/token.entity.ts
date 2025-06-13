import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TokenLifecycleStage, TokenCategory } from '../enums/lifecycle-stage.enum';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column()
  contractAddress: string;

  @Column()
  blockchain: string;

  @Column({
    type: 'enum',
    enum: TokenCategory
  })
  category: TokenCategory;

  @Column({
    type: 'enum',
    enum: TokenLifecycleStage,
    default: TokenLifecycleStage.LAUNCH
  })
  currentStage: TokenLifecycleStage;

  @Column({ type: 'timestamp' })
  launchDate: Date;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  initialPrice: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  currentPrice: number;

  @Column({ type: 'bigint', nullable: true })
  totalSupply: string;

  @Column({ type: 'bigint', nullable: true })
  circulatingSupply: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  marketCap: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  volume24h: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => TokenMetrics, metrics => metrics.token)
  metrics: TokenMetrics[];

  @OneToMany(() => LifecycleTransition, transition => transition.token)
  transitions: LifecycleTransition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}