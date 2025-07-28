import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("developer_activity_metrics")
@Index(["tokenSymbol", "timestamp"])
export class DeveloperActivityMetric {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  tokenSymbol: string

  @Column("int")
  commits24h: number // Number of commits in the last 24 hours

  @Column("int")
  uniqueContributors24h: number // Number of unique contributors in the last 24 hours

  @Column("int")
  forks: number // Total forks of the repository

  @Column("int")
  stars: number // Total stars of the repository

  @CreateDateColumn()
  timestamp: Date
}
