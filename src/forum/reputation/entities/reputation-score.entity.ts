import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ReputationScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  totalScore: number;

  @Column({ default: 0 })
  postScore: number;

  @Column({ default: 0 })
  commentScore: number;

  @Column({ default: 0 })
  voteScore: number;

  @Column({ default: 0 })
  onChainScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, user => user.reputationScore)
  @JoinColumn()
  user: User;
}
