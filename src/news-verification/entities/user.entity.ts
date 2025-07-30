import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { NewsArticle } from './news-article.entity';
import { Vote } from './vote.entity';

// User Entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  passwordHash: string;

  @Column({ default: 0 })
  reputationScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => NewsArticle, article => article.submittedBy)
  submittedArticles: NewsArticle[];

  @OneToMany(() => Vote, vote => vote.user)
  votes: Vote[];
}