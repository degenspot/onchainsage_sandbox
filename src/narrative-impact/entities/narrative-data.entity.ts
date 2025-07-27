import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('narrative_data')
@Index(['identifier', 'timestamp'])
@Index(['tokenSymbol', 'timestamp'])
export class NarrativeDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  tokenSymbol: string;

  @Column({ type: 'varchar', length: 100 })
  identifier: string; // hashtag or topic

  @Column({ type: 'enum', enum: ['hashtag', 'topic'] })
  type: 'hashtag' | 'topic';

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  sentiment: number; // -1 to 1

  @Column({ type: 'int' })
  volume: number; // number of mentions

  @Column({ type: 'bigint' })
  reach: number; // total reach/impressions

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  engagementRate: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
