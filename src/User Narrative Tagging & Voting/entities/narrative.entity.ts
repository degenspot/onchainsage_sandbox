import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Tag } from "./tag.entity";
import { User } from "./user.entity";

@Entity("narratives")
export class Narrative {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @Column({ name: "author_id" })
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "author_id" })
  author: User;

  @Column({ nullable: true })
  tokenId?: string;

  @Column({ nullable: true })
  eventId?: string;

  @OneToMany(() => Tag, (tag) => tag.narrative)
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
