import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id!: number; // Use ! to assert non-null (TypeORM handles initialization)

  @Column()
  name!: string; // e.g., "BTC Trading" or "DeFi Boom"

  @Column()
  type!: string; // "token" or "narrative"

  @Column()
  tokenOrNarrative!: string; // e.g., "BTC" or "DeFi Boom"

  @ManyToMany(() => User, { cascade: true })
  @JoinTable()
  members!: User[]; // Use ! to assert non-null (TypeORM populates)

  @ManyToMany(() => User, { cascade: true })
  @JoinTable()
  admins!: User[]; // Use ! to assert non-null (TypeORM populates)
}