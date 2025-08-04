import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('nfts')
@Index(['userId', 'achievementId'])
export class Nft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  achievementId: string;

  @Column()
  tokenId: string;

  @Column()
  contractAddress: string;

  @Column({ nullable: true })
  metadataUri: string;

  @Column({ default: false })
  isShowcased: boolean;

  @Column({ default: false })
  isForTrade: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}