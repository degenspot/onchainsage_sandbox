import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('news_articles')
@Index(['publishedAt', 'impactScore'])
@Index(['contentHash'])
export class NewsArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  url: string;

  @Column()
  source: string;

  @Column()
  author: string;

  @Column({ type: 'timestamp' })
  publishedAt: Date;

  @Column({ unique: true })
  contentHash: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  sentimentScore: number;

  @Column({ default: 'neutral' })
  sentimentLabel: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  impactScore: number;

  @Column('simple-array', { nullable: true })
  keywords: string[];

  @Column('simple-array', { nullable: true })
  cryptoMentions: string[];

  @Column({ default: false })
  isProcessed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}