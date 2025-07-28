import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export enum BlockchainProtocol {
  ETHEREUM = "ethereum",
  POLYGON = "polygon",
  BINANCE_SMART_CHAIN = "binance-smart-chain",
  ARBITRUM = "arbitrum",
  OPTIMISM = "optimism",
}

@Entity("blockchain_nodes")
@Index(["blockchain", "isActive"])
export class BlockchainNode {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  name: string // e.g., "Infura Ethereum Mainnet", "Alchemy Polygon"

  @Column({
    type: "enum",
    enum: BlockchainProtocol,
  })
  blockchain: BlockchainProtocol

  @Column()
  apiUrl: string

  @Column({ nullable: true })
  apiKey: string // For private APIs

  @Column({ default: 0 })
  lastSyncedBlock: number

  @Column({ default: true })
  isActive: boolean

  @Column("jsonb", { nullable: true })
  config: Record<string, any> // e.g., rate limits, specific endpoints

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
