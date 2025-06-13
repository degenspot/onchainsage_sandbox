import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { TokenLifecycleStage } from '../enums/lifecycle-stage.enum';

@Entity('lifecycle_transitions')
export class LifecycleTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tokenId: string;

  @ManyToOne(() => Token, token => token.transitions)
  @JoinColumn({ name: 'tokenId' })
  token: Token;

  @Column({
    type: 'enum',
    enum: TokenLifecycleStage
  })
  fromStage: TokenLifecycleStage;

  @Column({
    type: 'enum',
    enum: TokenLifecycleStage
  })
  toStage: TokenLifecycleStage;

  @Column({ type: 'timestamp' })
  transitionDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidence: number;

  @Column({ type: 'json' })
  triggerFactors: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}