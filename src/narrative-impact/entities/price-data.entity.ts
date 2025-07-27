import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('price_data')
@Index(['tokenSymbol', 'timestamp'])
export class PriceDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  tokenSymbol: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'bigint' })
  volume: number;

  @Column({ type: 'bigint' })
  marketCap: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  priceChange: number; // percentage change

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  volumeChange: number;

  @Column({ type: 'varchar', length: 5 })
  interval: string; // 1h, 4h, 1d, 1w

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}