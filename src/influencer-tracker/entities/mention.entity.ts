import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Influencer } from './influencer.entity';
import { Token } from './token.entity';

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tweetId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ default: 0 })
  retweetCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  replyCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  sentimentScore: number;

  @Column({ type: 'enum', enum: ['positive', 'negative', 'neutral'], default: 'neutral' })
  sentiment: 'positive' | 'negative' | 'neutral';

  @ManyToOne(() => Influencer, influencer => influencer.mentions)
  @JoinColumn({ name: 'influencerId' })
  influencer: Influencer;

  @Column()
  influencerId: string;

  @ManyToOne(() => Token, token => token.mentions)
  @JoinColumn({ name: 'tokenId' })
  token: Token;

  @Column()
  tokenId: string;

  @CreateDateColumn()
  createdAt: Date;
}
