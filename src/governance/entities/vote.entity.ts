import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { Proposal } from "./proposal.entity"

export enum VoteChoice {
  FOR = "for",
  AGAINST = "against",
  ABSTAIN = "abstain",
}

@Entity("votes")
@Index(["proposal", "voter"])
@Index(["voter"])
@Index(["votingPower"])
export class Vote {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index()
  voter: string

  @Column({
    type: "enum",
    enum: VoteChoice,
  })
  choice: VoteChoice

  @Column("decimal", { precision: 20, scale: 8 })
  votingPower: number

  @Column("text", { nullable: true })
  reason: string

  @Column("timestamp")
  timestamp: Date

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @ManyToOne(
    () => Proposal,
    (proposal) => proposal.votes,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "proposalId" })
  proposal: Proposal

  @Column()
  proposalId: string

  @CreateDateColumn()
  createdAt: Date
}
