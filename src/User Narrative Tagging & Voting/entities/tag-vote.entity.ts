import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from "typeorm";
import { Tag } from "./tag.entity";
import { User } from "./user.entity";

export enum VoteType {
  UPVOTE = "upvote",
  DOWNVOTE = "downvote",
}

@Entity("tag_votes")
@Index(["userId", "tagId"], { unique: true }) // One vote per user per tag
export class TagVote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.votes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "tag_id" })
  tagId: string;

  @ManyToOne(() => Tag, (tag) => tag.votes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tag_id" })
  tag: Tag;

  @Column({
    type: "enum",
    enum: VoteType,
  })
  voteType: VoteType;

  @CreateDateColumn()
  createdAt: Date;
}
