import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Tag } from "./tag.entity";
import { TagVote } from "./tag-vote.entity";
import { TagFlag } from "./tag-flag.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 0 })
  reputation: number;

  @OneToMany(() => Tag, (tag) => tag.creator)
  createdTags: Tag[];

  @OneToMany(() => TagVote, (vote) => vote.user)
  votes: TagVote[];

  @OneToMany(() => TagFlag, (flag) => flag.reporter)
  flagsReported: TagFlag[];

  @CreateDateColumn()
  createdAt: Date;
}
