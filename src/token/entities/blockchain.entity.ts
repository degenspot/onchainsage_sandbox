import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Token } from "./token.entity"

@Entity("blockchains")
export class Blockchain {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  name: string

  @Column({ unique: true })
  chainId: string

  @Column()
  type: string // 'EVM', 'Solana', etc.

  @Column()
  nativeCurrency: string

  @Column({ nullable: true })
  rpcUrl: string

  @Column({ nullable: true })
  explorerUrl: string

  @Column({ default: true })
  isActive: boolean

  @OneToMany(
    () => Token,
    (token) => token.blockchain,
  )
  tokens: Token[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
