import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { Vote } from './vote.entity';
@Entity('news_articles')
@Index(['verificationStatus'])
@Index(['createdAt'])
export class NewsArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  sourceUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'verified', 'false', 'misleading'],
    default: 'pending'
  })
  verificationStatus: 'pending' | 'verified' | 'false' | 'misleading';

  @Column({ default: 0 })
  verificationScore: number; // Net votes (upvotes - downvotes)

  @Column({ default: 0 })
  totalVotes: number;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @Column({ nullable: true })
  blockchainTxHash: string; // Transaction hash for verification logging

  @ManyToOne(() => User, user => user.submittedArticles)
  submittedBy: User;

  @OneToMany(() => Vote, vote => vote.article)
  votes: Vote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}