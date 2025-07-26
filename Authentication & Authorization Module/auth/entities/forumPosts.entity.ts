import { User } from "Authentication & Authorization Module/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ForumPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => User, user => user.posts)
  author: User;

  @CreateDateColumn()
  createdAt: Date;
}