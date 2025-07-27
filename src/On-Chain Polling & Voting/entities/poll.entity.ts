import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Vote } from "./vote.entity";

export enum PollType {
  PROPOSAL = "proposal",
  POLL = "poll",
}

export enum PollStatus {
  ACTIVE = "active",
  CLOSED = "closed",
  EXTENDED = "extended",
}

@Entity("polls")
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column({
    type: "enum",
    enum: PollType,
    default: PollType.POLL,
  })
  type: PollType;

  @Column({
    type: "enum",
    enum: PollStatus,
    default: PollStatus.ACTIVE,
  })
  status: PollStatus;

  @Column()
  creatorAddress: string;

  @Column("json")
  options: string[];

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  extendedUntil?: Date;

  @Column({ default: 0 })
  minimumTokenBalance: number;

  @Column({ nullable: true })
  contractAddress?: string;

  @Column({ nullable: true })
  transactionHash?: string;

  @OneToMany(() => Vote, (vote) => vote.poll)
  votes: Vote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
