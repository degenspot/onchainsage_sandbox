import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ReputationRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column()
  type: 'on-chain' | 'community';

  @Column('int')
  points: number;

  @Column({ default: true })
  active: boolean;
}