import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SuccessPattern, TokenCategory } from '../enums/lifecycle-stage.enum';

@Entity('pattern_recognition')
export class PatternRecognition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SuccessPattern
  })
  pattern: SuccessPattern;

  @Column({
    type: 'enum',
    enum: TokenCategory
  })
  category: TokenCategory;

  @Column({ type: 'json' })
  characteristics: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  successRate: number;

  @Column({ type: 'int' })
  sampleSize: number;

  @Column({ type: 'json' })
  keyMetrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
