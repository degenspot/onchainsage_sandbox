import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Token } from './token.entity';

@Entity('price_data')
export class PriceData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  volume24h: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  marketCap: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  priceChange24h: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  volumeChange24h: number;

  @ManyToOne(() => Token, token => token.priceData)
  @JoinColumn({ name: 'tokenId' })
  token: Token;

  @Column()
  tokenId: string;

  @CreateDateColumn()
  timestamp: Date;
}
