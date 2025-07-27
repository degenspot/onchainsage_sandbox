import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { Narrative } from "./narrative.entity";
import { User } from "./user.entity";
import { TagVote } from "./tag-vote.entity";
import { TagFlag } from "./tag-flag.entity";

export enum TagStatus {
  ACTIVE = "active",
  FLAGGED = "flagged",
  REMOVED = "removed",
}

@Entity("tags")
@Index(["narrativeId", "name"], { unique: true }) // Prevent duplicate tags on same narrative
export class Tag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ name: "narrative_id" })
  narrativeId: string;

  @ManyToOne(() => Narrative, (narrative) => narrative.tags, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "narrative_id" })
  narrative: Narrative;

  @Column({ name: "creator_id" })
  creatorId: string;

  @ManyToOne(() => User, (user) => user.createdTags)
  @JoinColumn({ name: "creator_id" })
  creator: User;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @Column({ default: 0 })
  score: number; // upvotes - downvotes

  @Column({
    type: "enum",
    enum: TagStatus,
    default: TagStatus.ACTIVE,
  })
  status: TagStatus;

  @OneToMany(() => TagVote, (vote) => vote.tag, { cascade: true })
  votes: TagVote[];

  @OneToMany(() => TagFlag, (flag) => flag.tag, { cascade: true })
  flags: TagFlag[];

  @CreateDateColumn()
  createdAt: Date;
}
