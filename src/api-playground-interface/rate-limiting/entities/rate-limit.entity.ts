import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('rate_limits')
@Index(['apiKey', 'windowStart'])
export class RateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKey: string;

  @Column()
  requestCount: number;

  @Column({ type: 'datetime' })
  windowStart: Date;

  @Column({ type: 'datetime' })
  windowEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}