import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserAchievement } from './user-achievement.entity';
import { AchievementCategory, AchievementRarity } from '../dto/achievement.dto';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: AchievementCategory,
  })
  category: AchievementCategory;

  @Column({
    type: 'enum',
    enum: AchievementRarity,
  })
  rarity: AchievementRarity;

  @Column()
  iconUrl: string;

  @Column('int')
  pointsReward: number;

  @Column('json')
  criteria: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => UserAchievement, userAchievement => userAchievement.achievement)
  userAchievements: UserAchievement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}