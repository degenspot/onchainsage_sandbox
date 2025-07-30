import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { NewsArticle } from './news-article.entity';
@Entity('votes')
@Index(['userId', 'articleId'], { unique: true }) // Prevent duplicate votes
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['up', 'down'] })
  voteType: 'up' | 'down';

  @Column()
  userId: string;

  @Column()
  articleId: string;

  @Column({ nullable: true })
  blockchainTxHash: string;

  @ManyToOne(() => User, user => user.votes)
  user: User;

  @ManyToOne(() => NewsArticle, article => article.votes)
  article: NewsArticle;

  @CreateDateColumn()
  createdAt: Date;
}