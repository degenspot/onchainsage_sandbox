import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import { Vote } from "./vote.entity"
import { ProposalDiscussion } from "./proposal-discussion.entity"

export enum ProposalStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUCCEEDED = "succeeded",
  DEFEATED = "defeated",
  QUEUED = "queued",
  EXECUTED = "executed",
  CANCELED = "canceled",
  EXPIRED = "expired",
}

export enum ProposalType {
  PARAMETER_CHANGE = "parameter_change",
  TREASURY = "treasury",
  UPGRADE = "upgrade",
  GENERAL = "general",
  EMERGENCY = "emergency",
}

@Entity("proposals")
@Index(["protocol", "status"])
@Index(["createdAt"])
@Index(["endTime"])
export class Proposal {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  @Index()
  proposalId: string

  @Column()
  @Index()
  protocol: string

  @Column()
  title: string

  @Column("text")
  description: string

  @Column()
  proposer: string

  @Column({
    type: "enum",
    enum: ProposalStatus,
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus

  @Column({
    type: "enum",
    enum: ProposalType,
    default: ProposalType.GENERAL,
  })
  type: ProposalType

  @Column("timestamp")
  startTime: Date

  @Column("timestamp")
  endTime: Date

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  forVotes: number

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  againstVotes: number

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  abstainVotes: number

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  quorum: number

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  totalVotingPower: number

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  sentimentScore: number

  @Column({ default: false })
  isHighImpact: boolean

  @OneToMany(
    () => Vote,
    (vote) => vote.proposal,
  )
  votes: Vote[]

  @OneToMany(
    () => ProposalDiscussion,
    (discussion) => discussion.proposal,
  )
  discussions: ProposalDiscussion[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
