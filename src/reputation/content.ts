import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column('text')
  body: string;

  @Column({ default: 'active' })
  status: 'active' | 'removed' | 'under_review' = 'active';

  @ManyToOne(() => User, { nullable: true })
  author: User;

  @Column({ type: 'int', default: 0 })
  flagScore: number; // aggregated reputation-weighted flags
}