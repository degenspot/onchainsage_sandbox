import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_points')
@Index(['userId'])
export class UserPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  userId: string;

  @Column('int', { default: 0 })
  totalPoints: number;

  @Column('int', { default: 0 })
  currentStreak: number;

  @Column('int', { default: 0 })
  longestStreak: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}