import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Challenge } from './challenge.entity';
import { User } from 'Authentication & Authorization Module/users/entities/user.entity';

@Entity()
export class ChallengeParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Challenge, challenge => challenge.participants)
  challenge: Challenge;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column({ type: 'boolean', default: false })
  isWinner: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}