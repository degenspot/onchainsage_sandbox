import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Mention } from './mention.entity';

@Entity('influencers')
export class Influencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  twitterHandle: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  twitterId: string;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  influenceScore: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @OneToMany(() => Mention, mention => mention.influencer)
  mentions: Mention[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
