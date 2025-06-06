import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ValidationStatus, ValidationType } from '../../../shared/enums/signal.enums';

@Entity('signal_validations')
@Index(['signalId', 'validationType'])
export class SignalValidation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  signalId: string;

  @Column({ type: 'enum', enum: ValidationType })
  validationType: ValidationType;

  @Column({ type: 'enum', enum: ValidationStatus })
  status: ValidationStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  validationScore: number;

  @Column({ type: 'text', nullable: true })
  validationNotes: string;

  @Column({ type: 'json', nullable: true })
  validationData: Record<string, any>;

  @Column({ nullable: true })
  validatedBy: string;

  @CreateDateColumn()
  validatedAt: Date;
}