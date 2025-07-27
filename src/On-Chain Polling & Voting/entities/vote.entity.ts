import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { Poll } from "./poll.entity";

@Entity("votes")
@Index(["voterAddress", "poll"], { unique: true })
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  voterAddress: string;

  @Column()
  optionIndex: number;

  @Column()
  tokenBalance: number;

  @Column()
  transactionHash: string;

  @Column()
  blockNumber: number;

  @ManyToOne(() => Poll, (poll) => poll.votes)
  poll: Poll;

  @CreateDateColumn()
  createdAt: Date;
}
