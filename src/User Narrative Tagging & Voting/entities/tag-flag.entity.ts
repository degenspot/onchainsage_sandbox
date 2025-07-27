import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Tag } from "./tag.entity";
import { User } from "./user.entity";

export enum FlagReason {
  SPAM = "spam",
  IRRELEVANT = "irrelevant",
  INAPPROPRIATE = "inappropriate",
  DUPLICATE = "duplicate",
}

export enum FlagStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  DISMISSED = "dismissed",
}

@Entity("tag_flags")
export class TagFlag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tag_id" })
  tagId: string;

  @ManyToOne(() => Tag, (tag) => tag.flags, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tag_id" })
  tag: Tag;

  @Column({ name: "reporter_id" })
  reporterId: string;

  @ManyToOne(() => User, (user) => user.flagsReported)
  @JoinColumn({ name: "reporter_id" })
  reporter: User;

  @Column({
    type: "enum",
    enum: FlagReason,
  })
  reason: FlagReason;

  @Column("text", { nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: FlagStatus,
    default: FlagStatus.PENDING,
  })
  status: FlagStatus;

  @CreateDateColumn()
  createdAt: Date;
}
