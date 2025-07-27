import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SignalComponent } from './signal-component.entity';
import { SignalTest } from './signal-test.entity';

export enum SignalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}

@Entity('signals')
export class Signal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  configuration: Record<string, any>;

  @Column({ type: 'json' })
  layout: Record<string, any>;

  @Column({ type: 'enum', enum: SignalStatus, default: SignalStatus.DRAFT })
  status: SignalStatus;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: 0 })
  shares: number;

  @Column({ default: 0 })
  likes: number;

  @ManyToOne(() => User, user => user.signals)
  creator: User;

  @Column()
  creatorId: string;

  @OneToMany(() => SignalComponent, component => component.signal, { cascade: true })
  components: SignalComponent[];

  @OneToMany(() => SignalTest, test => test.signal, { cascade: true })
  tests: SignalTest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
