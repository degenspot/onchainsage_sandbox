import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
@Index(['userId', 'achievementId'], { unique: true })
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  achievementId: string;

  @Column('int', { default: 0 })
  progress: number;

  @Column('int', { default: 1 })
  maxProgress: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  nftId: string;

  @ManyToOne(() => Achievement, achievement => achievement.userAchievements)
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  @CreateDateColumn()
  createdAt: Date;
}
