import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { Proposal } from "./proposal.entity"

@Entity("proposal_discussions")
@Index(["proposal"])
@Index(["author"])
@Index(["timestamp"])
export class ProposalDiscussion {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index()
  author: string

  @Column("text")
  content: string

  @Column("timestamp")
  timestamp: Date

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  sentimentScore: number

  @Column({ nullable: true })
  platform: string

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @ManyToOne(
    () => Proposal,
    (proposal) => proposal.discussions,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "proposalId" })
  proposal: Proposal

  @Column()
  proposalId: string

  @CreateDateColumn()
  createdAt: Date
}
