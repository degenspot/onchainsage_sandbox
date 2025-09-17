import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ModerationAction } from './ModerationAction';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ unique: true })
  username: string;

  @Column({ default: 0 })
  reputation: number; // numeric reputation score

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => ModerationAction, (action) => action.actor)
  actions: ModerationAction[];
}