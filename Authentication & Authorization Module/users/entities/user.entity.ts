import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Permission } from '../../common/enums/permission.enum';
import { ForumPost } from 'Authentication & Authorization Module/auth/entities/forumPosts.entity';
import { Comment } from 'Authentication & Authorization Module/auth/entities/comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BASIC_USER,
  })
  role: UserRole;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ default: 0 })
  reputationScore: number;

  @Column({ nullable: true })
  reputationBadge: string; // bronze, silver, gold, etc.

  @OneToMany(() => ForumPost, post => post.author)
  posts: ForumPost[];

  @OneToMany(() => Comment, comment => comment.author)
  comments: Comment[];

  @Column('simple-array', { default: '' })
  permissions: Permission[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}