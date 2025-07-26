import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Mention } from './mention.entity';
import { PriceData } from './price-data.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ nullable: true })
  coingeckoId: string;

  @Column({ default: true })
  isTracked: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  keywords: string[];

  @OneToMany(() => Mention, mention => mention.token)
  mentions: Mention[];

  @OneToMany(() => PriceData, priceData => priceData.token)
  priceData: PriceData[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}