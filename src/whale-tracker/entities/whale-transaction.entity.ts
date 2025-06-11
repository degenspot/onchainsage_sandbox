import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { WhaleWallet } from './whale-wallet.entity';

export enum TransactionType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

@Entity('whale_transactions')
@Index(['blockNumber', 'transactionHash'])
export class WhaleTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transactionHash: string;

  @Column()
  blockNumber: number;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'float', default: 0 })
  impactScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  gasPrice: number;

  @Column({ type: 'int', nullable: true })
  gasUsed: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ManyToOne(() => WhaleWallet, wallet => wallet.transactions)
  wallet: WhaleWallet;

  @CreateDateColumn()
  createdAt: Date;
}